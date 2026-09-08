import { getFirestore } from 'firebase-admin/firestore';
import { fetchNewToken, fetchRefreshedToken, BankilyTokenResponse } from './client';

const TOKEN_DOC_PATH = 'system/bankilyToken';
/** Marge de sécurité avant expiration réelle, pour éviter d'utiliser un token qui expire en cours de requête. */
const EXPIRY_SAFETY_MARGIN_MS = 30_000;

interface StoredToken {
  accessToken: string;
  expiresAt: number;
  refreshToken: string;
  refreshExpiresAt: number;
}

/**
 * Retourne un access_token marchand Bankily valide, partagé entre toutes les
 * instances de Cloud Functions via Firestore (le token OAuth expire en quelques
 * minutes ; le cacher évite de ré-authentifier à chaque appel de paiement).
 */
export async function getMerchantAccessToken(): Promise<string> {
  const ref = getFirestore().doc(TOKEN_DOC_PATH);
  const snap = await ref.get();
  const now = Date.now();
  const stored = snap.exists ? (snap.data() as StoredToken) : null;

  if (stored && stored.expiresAt > now + EXPIRY_SAFETY_MARGIN_MS) {
    return stored.accessToken;
  }

  if (stored && stored.refreshExpiresAt > now + EXPIRY_SAFETY_MARGIN_MS) {
    try {
      const refreshed = await fetchRefreshedToken(stored.refreshToken);
      await persist(ref, refreshed);
      return refreshed.access_token;
    } catch {
      // Le refresh token est peut-être déjà invalidé côté Bankily — on retombe sur une ré-auth complète.
    }
  }

  const fresh = await fetchNewToken();
  await persist(ref, fresh);
  return fresh.access_token;
}

async function persist(
  ref: FirebaseFirestore.DocumentReference,
  token: BankilyTokenResponse
): Promise<void> {
  const now = Date.now();
  const stored: StoredToken = {
    accessToken: token.access_token,
    expiresAt: now + Number(token.expires_in) * 1000,
    refreshToken: token.refresh_token,
    refreshExpiresAt: now + Number(token.refresh_expires_in) * 1000,
  };
  await ref.set(stored);
}
