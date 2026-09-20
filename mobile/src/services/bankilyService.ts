import { BankilyFakeApi } from './bankilyFakeApi';

/**
 * FAKE (branche feature/mock-bankily-api) : les appels ci-dessous ne passent
 * plus par les Cloud Functions `initiateBankilyPayment`/`checkBankilyTransaction`,
 * ils sont servis localement par BankilyFakeApi (toujours succès, aucun appel
 * réseau). Le champ `status` de l'Investment en Firestore n'est donc plus mis à
 * jour (ce n'est possible que côté Admin SDK) : seul l'écran de paiement voit le
 * succès, le dashboard/portfolio continuera d'afficher "En attente".
 */
const bankilyFakeApi = new BankilyFakeApi();

export type BankilyTransactionStatus = 'TS' | 'TF' | 'TA';

export interface InitiatePaymentResult {
  transactionId?: string;
}

/**
 * Code d'erreur normalisé (sans le préfixe "functions/" que renvoie RNFirebase),
 * pour que l'UI puisse réagir différemment selon la nature de l'échec plutôt que
 * d'afficher un message générique. Reflète les `HttpsError` levées par les
 * Cloud Functions `initiateBankilyPayment`/`checkBankilyTransaction`.
 */
export type BankilyErrorCode =
  | 'unauthenticated'
  | 'permission-denied'
  | 'not-found'
  | 'invalid-argument'
  | 'failed-precondition' // paiement déjà traité — il faut vérifier le vrai statut, pas juste réessayer
  | 'aborted' // rejet Bankily propre (passcode invalide...) — nouvel essai possible avec un nouveau passcode
  | 'unavailable' // panne/issue réseau ambiguë — ne PAS considérer comme un échec définitif
  | 'internal'
  | 'unknown';

export class BankilyCallError extends Error {
  constructor(message: string, readonly code: BankilyErrorCode) {
    super(message);
    this.name = 'BankilyCallError';
  }
}

export function toBankilyCallError(err: unknown): BankilyCallError {
  const raw = (err as { code?: string; message?: string })?.code ?? '';
  const code = raw.replace(/^functions\//, '') as BankilyErrorCode;
  const message = (err as { message?: string })?.message ?? 'Erreur inconnue';
  const known: BankilyErrorCode[] = [
    'unauthenticated', 'permission-denied', 'not-found', 'invalid-argument',
    'failed-precondition', 'aborted', 'unavailable', 'internal',
  ];
  return new BankilyCallError(message, known.includes(code) ? code : 'unknown');
}

/**
 * Déclenche le paiement B-PAY. En production, appelle la Cloud Function
 * `initiateBankilyPayment` (le client ne détient jamais les identifiants
 * marchand — voir CLAUDE.md section 4.A) ; sur cette branche, servi par
 * BankilyFakeApi (voir note en tête de fichier).
 */
export async function initiatePayment(
  investmentId: string,
  clientPhone: string,
  passcode: string
): Promise<InitiatePaymentResult> {
  try {
    return await bankilyFakeApi.initiatePayment(investmentId, clientPhone, passcode);
  } catch (err) {
    throw toBankilyCallError(err);
  }
}

/**
 * Interroge le statut de la transaction. En production, appelle la Cloud
 * Function `checkBankilyTransaction` ; sur cette branche, servi par
 * BankilyFakeApi (toujours `TS`). À appeler en polling depuis l'écran de
 * paiement tant que le statut est `TA`.
 */
export async function checkTransactionStatus(
  investmentId: string
): Promise<BankilyTransactionStatus> {
  try {
    return await bankilyFakeApi.checkTransactionStatus(investmentId);
  } catch (err) {
    throw toBankilyCallError(err);
  }
}
