import { onSchedule } from 'firebase-functions/v2/scheduler';
import { FieldValue, Timestamp, getFirestore } from 'firebase-admin/firestore';
import { BANKILY_SECRETS, callCheckTransaction } from './client';
import { getMerchantAccessToken } from './tokenCache';
import { logBankilyIncident } from './auditLog';

/**
 * Un investissement PROCESSING depuis plus longtemps que ça n'a probablement plus
 * personne en train de le polliner depuis l'écran de paiement (l'utilisateur a
 * quitté l'app, ou le device est mort avant la fin) — c'est le filet de sécurité
 * qui évite qu'un paiement reste bloqué indéfiniment sans que personne ne le sache.
 */
const STUCK_THRESHOLD_MS = 5 * 60 * 1000;

/**
 * Réconciliation planifiée des paiements B-PAY laissés en PROCESSING.
 * Le polling client (payment.tsx) résout la majorité des cas en quelques
 * secondes, mais ne survit pas si l'utilisateur ferme l'app avant la fin —
 * ce job est la seule garantie que le statut finit par être tranché.
 */
export const reconcileBankilyPayments = onSchedule(
  { schedule: 'every 5 minutes', secrets: BANKILY_SECRETS, region: 'europe-west1' },
  async () => {
    const db = getFirestore();
    const cutoff = Timestamp.fromMillis(Date.now() - STUCK_THRESHOLD_MS);

    const snap = await db
      .collection('investments')
      .where('status', '==', 'PROCESSING')
      .where('processingAt', '<=', cutoff)
      .get();

    if (snap.empty) {
      console.log('[reconcileBankilyPayments] Rien à réconcilier.');
      return;
    }

    let accessToken: string;
    try {
      accessToken = await getMerchantAccessToken();
    } catch (err) {
      console.error('[reconcileBankilyPayments] Authentification marchand indisponible, réessai au prochain cycle:', err);
      return;
    }

    for (const doc of snap.docs) {
      try {
        const result = await callCheckTransaction(accessToken, doc.id);
        const status = result.status ?? 'TA';

        if (status === 'TS') {
          await doc.ref.update({
            status: 'SUCCESS',
            paidAt: FieldValue.serverTimestamp(),
            transactionId: result.transactionId ?? doc.data().transactionId ?? null,
            reconciledAt: FieldValue.serverTimestamp(),
          });
          console.log(`[reconcileBankilyPayments] ${doc.id} résolu par réconciliation : SUCCESS`);
        } else if (status === 'TF') {
          await doc.ref.update({
            status: 'FAILED',
            bankilyError: result.errorMessage ?? 'Transaction refusée par Bankily (réconciliation).',
            reconciledAt: FieldValue.serverTimestamp(),
          });
          await logBankilyIncident({
            investmentId: doc.id, userId: doc.data().userId, operation: 'checkTransaction', outcome: 'rejected',
            errorCode: result.errorCode, errorMessage: result.errorMessage ?? null,
            transactionId: result.transactionId ?? doc.data().transactionId ?? null,
          });
          console.log(`[reconcileBankilyPayments] ${doc.id} résolu par réconciliation : FAILED`);
        } else {
          console.log(`[reconcileBankilyPayments] ${doc.id} toujours en attente (TA) — revérifié au prochain cycle`);
        }
      } catch (err) {
        // On n'écrit rien sur l'investissement : ce document sera retenté au prochain cycle planifié.
        console.error(`[reconcileBankilyPayments] Échec de vérification pour ${doc.id}, retenté au prochain cycle:`, err);
        await logBankilyIncident({
          investmentId: doc.id, userId: doc.data().userId, operation: 'checkTransaction', outcome: 'network_error',
          errorMessage: err instanceof Error ? err.message : String(err),
          transactionId: doc.data().transactionId ?? null,
        });
      }
    }
  }
);
