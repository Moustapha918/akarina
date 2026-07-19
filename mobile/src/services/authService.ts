import {
  signInWithPhoneNumber,
  signInAnonymously,
  ConfirmationResult,
  signOut as firebaseSignOut,
  ApplicationVerifier,
} from 'firebase/auth';
import { auth } from './firebase';
import { PHONE_PREFIX, DEV_TEST_PHONES } from '../constants';

let _confirmationResult: ConfirmationResult | null = null;

/**
 * Envoie un OTP au numéro de téléphone.
 * En mode DEV, les numéros de DEV_TEST_PHONES bypassent reCAPTCHA et l'envoi SMS.
 * @param localNumber - Chiffres du numéro sans le préfixe pays
 * @param appVerifier - Peut être null en mode dev bypass
 * @param prefix - Indicatif pays (défaut +222)
 */
export async function sendOtp(
  localNumber: string,
  appVerifier: ApplicationVerifier | null,
  prefix: string = PHONE_PREFIX
): Promise<boolean> {
  const fullPhone = `${prefix}${localNumber}`;

  // ── Dev bypass : Simulator / Expo Go ────────────────────────────────────────
  if (__DEV__ && DEV_TEST_PHONES[fullPhone] !== undefined) {
    const expectedCode = DEV_TEST_PHONES[fullPhone];
    _confirmationResult = {
      verificationId: 'dev-bypass',
      confirm: async (code: string) => {
        if (code !== expectedCode) {
          throw new Error(`Code invalide. Utilisez "${expectedCode}" en mode dev.`);
        }
        return await signInAnonymously(auth);
      },
    } as unknown as ConfirmationResult;
    return true; // indique que le bypass a été utilisé
  }

  // ── Production : reCAPTCHA + SMS réel ───────────────────────────────────────
  if (!appVerifier) throw new Error('Vérificateur reCAPTCHA non disponible.');
  _confirmationResult = await signInWithPhoneNumber(auth, fullPhone, appVerifier);
  return false;
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
