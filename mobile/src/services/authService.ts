import auth from '@react-native-firebase/auth';
import { PHONE_PREFIX } from '../constants';

let _confirmationResult: Awaited<ReturnType<ReturnType<typeof auth>['signInWithPhoneNumber']>> | null = null;

/**
 * Envoie un OTP au numéro de téléphone via Firebase Auth.
 * Le reCAPTCHA est géré nativement par @react-native-firebase (Play Integrity / APNs).
 */
export async function sendOtp(
  localNumber: string,
  _appVerifier: unknown = null,
  prefix: string = PHONE_PREFIX,
): Promise<void> {
  const fullPhone = `${prefix}${localNumber}`;
  _confirmationResult = await auth().signInWithPhoneNumber(fullPhone);
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
  if (!credential?.user) throw new Error('Vérification échouée.');
  return credential.user.uid;
}

export async function signOut(): Promise<void> {
  _confirmationResult = null;
  await auth().signOut();
}
