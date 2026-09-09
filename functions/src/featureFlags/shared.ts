import { CallableRequest, HttpsError } from 'firebase-functions/v2/https';

/** Convention : tous les paramètres Remote Config gérés comme feature flags portent ce préfixe. */
export const FLAG_PREFIX = 'feature_';

/** Lève une erreur si l'appelant n'est pas authentifié avec le custom claim ADMIN. */
export function requireAdmin(request: CallableRequest): void {
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Connexion requise.');
  }
  if (request.auth.token['role'] !== 'ADMIN') {
    throw new HttpsError('permission-denied', 'Réservé aux administrateurs.');
  }
}
