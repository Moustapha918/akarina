import auth from '@react-native-firebase/auth';
import { PHONE_PREFIX, DEV_TEST_PHONES } from '../constants';

let _confirmationResult: ReturnType<typeof auth['signInWithPhoneNumber']> extends Promise<infer R> ? R : never | null = null;

/**
 * Envoie un OTP au numéro de téléphone.
 * En mode DEV, les numéros de DEV_TEST_PHONES bypassent l'envoi SMS.
 * @react-native-firebase/auth gère le reCAPTCHA nativement (Play Integrity / APNs).
 */
export async function sendOtp(
  localNumber: string,
  _appVerifier: unknown = null, // conservé pour compatibilité signature — ignoré
  prefix: string = PHONE_PREFIX,
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
        return auth().signInAnonymously();
      },
    } as any;
    return true;
  }

  // ── Production : reCAPTCHA natif géré par react-native-firebase ─────────────
  _confirmationResult = await auth().signInWithPhoneNumber(fullPhone);
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
  if (!credential?.user) throw new Error('Vérification échouée.');
  return credential.user.uid;
}

export async function signOut(): Promise<void> {
  _confirmationResult = null;
  await auth().signOut();
}
