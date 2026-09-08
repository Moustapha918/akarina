import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { BANKILY_SECRETS, BankilyNetworkError, callPayment } from './client';
import { getMerchantAccessToken } from './tokenCache';
import { logBankilyIncident } from './auditLog';

interface InitiatePaymentRequest {
  investmentId: string;
  clientPhone: string;
  passcode: string;
  language?: 'fr' | 'ar' | 'en';
}

interface InitiatePaymentResult {
  transactionId?: string;
}

/**
 * Déclenche le débit B-PAY pour un investissement PENDING.
 *
 * Le client mobile ne connaît jamais le token marchand : il envoie uniquement
 * le numéro Bankily et le passcode récupérés par l'utilisateur dans l'app Bankily
 * (voir bankily-docs/etape_de_paiement B-PAY.docx — pas de push OTP, échange manuel).
 */
export const initiateBankilyPayment = onCall<InitiatePaymentRequest>(
  { secrets: BANKILY_SECRETS, region: 'europe-west1' },
  async (request): Promise<InitiatePaymentResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const { investmentId, clientPhone, passcode, language } = request.data;
    if (!investmentId || !clientPhone || !passcode) {
      throw new HttpsError('invalid-argument', 'Numéro de téléphone et passcode requis.');
    }

    const db = getFirestore();
    const investmentRef = db.doc(`investments/${investmentId}`);
    const investmentSnap = await investmentRef.get();
    if (!investmentSnap.exists) {
      throw new HttpsError('not-found', 'Investissement introuvable.');
    }

    const investment = investmentSnap.data()!;
    if (investment.userId !== request.auth.uid) {
      throw new HttpsError('permission-denied', "Cet investissement ne vous appartient pas.");
    }
    if (investment.status !== 'PENDING') {
      // Couvre aussi le cas où une tentative précédente a laissé l'investissement en
      // PROCESSING suite à une issue ambiguë (voir plus bas) : on refuse un nouveau
      // /payment tant que le statut réel n'est pas résolu par checkBankilyTransaction.
      throw new HttpsError('failed-precondition', 'Ce paiement a déjà été traité.');
    }

    let accessToken: string;
    try {
      accessToken = await getMerchantAccessToken();
    } catch (err) {
      console.error('[initiateBankilyPayment] Authentification marchand indisponible:', err);
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'auth', outcome: 'auth_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError(
        'unavailable',
        'Le service de paiement Bankily est momentanément indisponible. Réessayez dans un instant.'
      );
    }

    let result;
    try {
      result = await callPayment(accessToken, {
        clientPhone,
        passcode,
        amount: String(investment.amount),
        operationId: investmentId,
        language: language ?? 'fr',
      });
    } catch (err) {
      if (err instanceof BankilyNetworkError) {
        // Issue ambiguë : on ne sait pas si Bankily a traité le débit malgré l'absence
        // de réponse exploitable. On NE remet PAS le statut à PENDING (ce qui autoriserait
        // un nouveau /payment et risquerait un double débit) : on bascule en PROCESSING et
        // on laisse checkBankilyTransaction — via le polling client ou le job de
        // réconciliation planifié — trancher le statut réel avec operationId=investmentId
        // comme clé d'idempotence.
        console.error('[initiateBankilyPayment] Réponse Bankily ambiguë (réseau), passage en PROCESSING pour réconciliation:', err);
        await investmentRef.update({
          status: 'PROCESSING',
          bankilyPhone: clientPhone,
          bankilyError: 'Réponse réseau ambiguë — vérification en cours.',
          processingAt: FieldValue.serverTimestamp(),
        });
        await logBankilyIncident({
          investmentId, userId: request.auth.uid, operation: 'payment', outcome: 'network_error',
          errorMessage: err.message,
        });
        throw new HttpsError(
          'unavailable',
          "Nous n'avons pas pu confirmer votre paiement immédiatement. Vérification en cours."
        );
      }
      console.error('[initiateBankilyPayment] Erreur inattendue lors de /payment:', err);
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'payment', outcome: 'network_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError('internal', 'Erreur inattendue lors du paiement.');
    }

    if (Number(result.errorCode) !== 0) {
      // Rejet synchrone (passcode invalide, token expiré...) : Bankily n'a pas créé de
      // transaction, on laisse l'investissement PENDING pour permettre un nouvel essai
      // avec un passcode frais, sans recréer d'investissement (même operationId).
      await investmentRef.update({
        bankilyError: result.errorMessage ?? `Erreur Bankily (code ${result.errorCode})`,
      });
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'payment', outcome: 'rejected',
        errorCode: result.errorCode, errorMessage: result.errorMessage ?? null,
        transactionId: result.transactionId ?? null,
      });
      throw new HttpsError('aborted', result.errorMessage ?? 'Paiement refusé par Bankily.');
    }

    await investmentRef.update({
      status: 'PROCESSING',
      transactionId: result.transactionId ?? null,
      bankilyPhone: clientPhone,
      processingAt: FieldValue.serverTimestamp(),
    });

    return { transactionId: result.transactionId };
  }
);
