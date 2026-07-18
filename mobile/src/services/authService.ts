import {
  signInWithPhoneNumber,
  ConfirmationResult,
  signOut as firebaseSignOut,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from './firebase';
import { PHONE_PREFIX } from '../constants';

let _confirmationResult: ConfirmationResult | null = null;

/**
 * Envoie un OTP au numéro mauritanien.
 * @param localNumber - Les 8 chiffres du numéro (sans +222)
 */
export async function sendOtp(
  localNumber: string,
  appVerifier: ApplicationVerifier
): Promise<void> {
  const fullPhone = `${PHONE_PREFIX}${localNumber}`;

  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error('Délai dépassé. Vérifiez votre connexion et réessayez.')), 20_000)
  );

  _confirmationResult = await Promise.race([
    signInWithPhoneNumber(auth, fullPhone, appVerifier),
    timeout,
  ]);
}

/**
 * Vérifie le code OTP saisi par l'utilisateur.
 * Retourne l'UID Firebase si succès.
 */
export async function verifyOtp(code: string): Promise<string> {
  if (!_confirmationResult) {
    throw new Error('Aucun OTP en attente. Recommencez depuis le début.');
  }
  const credential = await _confirmationResult.confirm(code);
  if (!credential.user) throw new Error('Vérification échouée.');
  return credential.user.uid;
}

export async function signOut(): Promise<void> {
  _confirmationResult = null;
  await firebaseSignOut(auth);
}
