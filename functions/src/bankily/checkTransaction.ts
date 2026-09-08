import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { BANKILY_SECRETS, BankilyTransactionStatus, callCheckTransaction } from './client';
import { getMerchantAccessToken } from './tokenCache';
import { logBankilyIncident } from './auditLog';

interface CheckTransactionRequest {
  investmentId: string;
}

interface CheckTransactionResult {
  status: BankilyTransactionStatus;
}

/**
 * Interroge le statut réel d'un paiement B-PAY déjà initié (polling actif —
 * l'API Bankily testée ne pousse aucun webhook de confirmation).
 */
export const checkBankilyTransaction = onCall<CheckTransactionRequest>(
  { secrets: BANKILY_SECRETS, region: 'europe-west1' },
  async (request): Promise<CheckTransactionResult> => {
    if (!request.auth) {
      throw new HttpsError('unauthenticated', 'Connexion requise.');
    }

    const { investmentId } = request.data;
    if (!investmentId) {
      throw new HttpsError('invalid-argument', 'investmentId requis.');
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

    // Déjà finalisé lors d'un appel précédent — pas besoin de rappeler Bankily.
    if (investment.status === 'SUCCESS') return { status: 'TS' };
    if (investment.status === 'FAILED') return { status: 'TF' };

    let accessToken: string;
    try {
      accessToken = await getMerchantAccessToken();
    } catch (err) {
      console.error('[checkBankilyTransaction] Authentification marchand indisponible:', err);
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'auth', outcome: 'auth_error',
        errorMessage: err instanceof Error ? err.message : String(err),
      });
      throw new HttpsError('unavailable', 'Le service Bankily est momentanément indisponible.');
    }

    let result;
    try {
      result = await callCheckTransaction(accessToken, investmentId);
    } catch (err) {
      // Erreur réseau : on ne sait toujours pas ce qu'il en est. On laisse le statut
      // Firestore inchangé (PROCESSING) plutôt que de conclure à tort — le client (ou
      // le job de réconciliation planifié) retentera au prochain cycle.
      console.error('[checkBankilyTransaction] Erreur réseau lors de la vérification:', err);
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'checkTransaction', outcome: 'network_error',
        errorMessage: err instanceof Error ? err.message : String(err),
        transactionId: investment.transactionId ?? null,
      });
      throw new HttpsError('unavailable', 'Impossible de vérifier le paiement pour le moment. Réessayez.');
    }

    const status = result.status ?? 'TA';

    if (status === 'TS') {
      await investmentRef.update({
        status: 'SUCCESS',
        paidAt: FieldValue.serverTimestamp(),
        transactionId: result.transactionId ?? investment.transactionId ?? null,
      });
    } else if (status === 'TF') {
      await investmentRef.update({
        status: 'FAILED',
        bankilyError: result.errorMessage ?? 'Transaction refusée par Bankily.',
      });
      await logBankilyIncident({
        investmentId, userId: request.auth.uid, operation: 'checkTransaction', outcome: 'rejected',
        errorCode: result.errorCode, errorMessage: result.errorMessage ?? null,
        transactionId: result.transactionId ?? investment.transactionId ?? null,
      });
    }

    return { status };
  }
);
