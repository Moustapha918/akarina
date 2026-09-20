import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

interface CancelInvestmentRequest {
  investmentId: string;
}

interface CancelInvestmentResult {
  status: 'CANCELLED';
}

/**
 * Annule un investissement encore PENDING (contrat signé, aucun paiement Bankily
 * initié). Le statut n'étant modifiable côté client par aucune règle Firestore
 * (voir firestore.rules), cette transition passe par une Cloud Function Admin SDK,
 * comme initiateBankilyPayment/checkBankilyTransaction.
 */
export const cancelInvestment = onCall<CancelInvestmentRequest>(
  { region: 'europe-west1' },
  async (request): Promise<CancelInvestmentResult> => {
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
    if (investment.status !== 'PENDING') {
      // Un paiement Bankily a déjà été tenté (PROCESSING) ou l'investissement est déjà
      // terminal (SUCCESS/FAILED/CANCELLED) : on ne revient pas dessus depuis ici.
      throw new HttpsError('failed-precondition', 'Cet investissement ne peut plus être annulé.');
    }

    await investmentRef.update({
      status: 'CANCELLED',
      cancelledAt: FieldValue.serverTimestamp(),
    });

    return { status: 'CANCELLED' };
  }
);
