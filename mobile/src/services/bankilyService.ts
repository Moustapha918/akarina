import { getApp } from '@react-native-firebase/app';
import { getFunctions, httpsCallable } from '@react-native-firebase/functions';

// Les Cloud Functions Bankily sont déployées en europe-west1 (voir functions/src/bankily/*.ts) —
// @react-native-firebase cible us-central1 par défaut, la région doit donc être explicite ici.
const functionsInstance = getFunctions(getApp(), 'europe-west1');

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

function toBankilyCallError(err: unknown): BankilyCallError {
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
 * Déclenche le paiement B-PAY côté serveur (Cloud Function `initiateBankilyPayment`).
 *
 * Le client ne détient jamais les identifiants marchand Bankily : il transmet
 * uniquement le numéro Bankily et le passcode que l'utilisateur est allé chercher
 * dans l'app Bankily (fonctionnalité B-PAY) — voir CLAUDE.md section 4.A.
 */
export async function initiatePayment(
  investmentId: string,
  clientPhone: string,
  passcode: string
): Promise<InitiatePaymentResult> {
  const call = httpsCallable<
    { investmentId: string; clientPhone: string; passcode: string },
    InitiatePaymentResult
  >(functionsInstance, 'initiateBankilyPayment');
  try {
    const { data } = await call({ investmentId, clientPhone, passcode });
    return data;
  } catch (err) {
    throw toBankilyCallError(err);
  }
}

/**
 * Interroge le statut réel de la transaction (Cloud Function `checkBankilyTransaction`).
 * À appeler en polling depuis l'écran de paiement tant que le statut est `TA`.
 */
export async function checkTransactionStatus(
  investmentId: string
): Promise<BankilyTransactionStatus> {
  const call = httpsCallable<
    { investmentId: string },
    { status: BankilyTransactionStatus }
  >(functionsInstance, 'checkBankilyTransaction');
  try {
    const { data } = await call({ investmentId });
    return data.status;
  } catch (err) {
    throw toBankilyCallError(err);
  }
}
