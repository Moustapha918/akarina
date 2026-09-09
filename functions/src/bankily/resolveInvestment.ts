import { FieldValue, Firestore } from 'firebase-admin/firestore';

/**
 * Marque un investissement SUCCESS. `projects/{id}.collectedAmount` et
 * `currentInvestors` ne sont plus maintenus ici — le mobile les recalcule à la
 * volée depuis les investissements SUCCESS (voir `projectService.ts` côté
 * mobile), donc il n'y a plus d'agrégat dénormalisé à mettre à jour de façon
 * atomique ici.
 *
 * Retourne false si l'investissement était déjà résolu (no-op idempotent —
 * utile car `checkBankilyTransaction` et le job de réconciliation planifié
 * peuvent tenter de résoudre le même investissement au même moment).
 */
export async function resolveInvestmentSuccess(
  db: Firestore,
  investmentId: string,
  transactionId: string | null
): Promise<boolean> {
  const investmentRef = db.doc(`investments/${investmentId}`);
  const snap = await investmentRef.get();
  if (!snap.exists) return false;

  const investment = snap.data()!;
  if (investment.status === 'SUCCESS') return false;

  await investmentRef.update({
    status: 'SUCCESS',
    paidAt: FieldValue.serverTimestamp(),
    transactionId: transactionId ?? investment.transactionId ?? null,
  });
  return true;
}
