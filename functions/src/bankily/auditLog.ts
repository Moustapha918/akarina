import { FieldValue, getFirestore } from 'firebase-admin/firestore';

export type BankilyLogOperation = 'auth' | 'payment' | 'checkTransaction';

/**
 * - network_error : pas de réponse Bankily exploitable (timeout, DNS, 5xx...).
 * - rejected      : Bankily a répondu proprement avec un errorCode métier non nul,
 *                    ou un statut TF (transaction refusée).
 * - auth_error    : échec d'authentification marchand (jamais imputable au client).
 */
export type BankilyLogOutcome = 'network_error' | 'rejected' | 'auth_error';

interface BankilyLogEntry {
  investmentId?: string;
  userId?: string;
  operation: BankilyLogOperation;
  outcome: BankilyLogOutcome;
  errorCode?: string | number | null;
  errorMessage?: string | null;
  transactionId?: string | null;
}

/**
 * Trace en Firestore (collection `bankilyLogs`) toute interaction Bankily en erreur
 * ou sans réponse exploitable — jamais les succès (voir demande produit : on ne
 * conserve que ce qui nécessite un suivi/audit). Utilisé pour le support et la
 * conformité (piste d'audit financier), pas pour piloter la logique métier.
 *
 * Best-effort : un échec d'écriture du log ne doit jamais faire échouer le flux de
 * paiement lui-même.
 */
export async function logBankilyIncident(entry: BankilyLogEntry): Promise<void> {
  try {
    await getFirestore()
      .collection('bankilyLogs')
      .add({
        investmentId: entry.investmentId ?? null,
        userId: entry.userId ?? null,
        operation: entry.operation,
        outcome: entry.outcome,
        errorCode: entry.errorCode ?? null,
        errorMessage: entry.errorMessage ?? null,
        transactionId: entry.transactionId ?? null,
        createdAt: FieldValue.serverTimestamp(),
      });
  } catch (err) {
    console.error('[bankilyLogs] Échec de journalisation (non bloquant):', err);
  }
}
