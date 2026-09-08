import { onDocumentWritten } from 'firebase-functions/v2/firestore';
import { getAuth } from 'firebase-admin/auth';

/**
 * Synchronise le champ Firestore `users/{userId}.role` vers le custom claim
 * Firebase Auth `role`, seul mécanisme lu par firestore.rules
 * (`request.auth.token.role`). Sans ce trigger, éditer le champ Firestore comme
 * documenté dans le README ("passer un utilisateur en ADMIN") ne fait rien côté
 * règles de sécurité — le champ Firestore et le custom claim sont deux choses
 * distinctes.
 */
export const syncAdminClaim = onDocumentWritten('users/{userId}', async (event) => {
  const after = event.data?.after;
  if (!after?.exists) return; // document supprimé — rien à synchroniser

  const before = event.data?.before;
  const newRole = after.data()?.['role'] as string | undefined;
  const previousRole = before?.exists ? (before.data()?.['role'] as string | undefined) : undefined;

  if (newRole === previousRole) return; // rôle inchangé, on évite un appel Admin Auth inutile

  const userId = event.params.userId;
  try {
    await getAuth().setCustomUserClaims(userId, { role: newRole ?? null });
    console.log(`[syncAdminClaim] Claim "role" mis à jour pour ${userId}: ${previousRole ?? '∅'} → ${newRole ?? '∅'}`);
  } catch (err) {
    console.error(`[syncAdminClaim] Échec de synchronisation du claim pour ${userId}:`, err);
  }
});
