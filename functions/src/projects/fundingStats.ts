import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { getFirestore } from 'firebase-admin/firestore';

interface FundingStatsRequest {
  projectIds: string[];
}

interface ProjectFundingStats {
  collectedAmount: number;
  currentInvestors: number;
}

type FundingStatsResult = Record<string, ProjectFundingStats>;

/** Limite de la clause Firestore `in`. */
const MAX_PROJECT_IDS = 30;

/**
 * Calcule le montant collecté et le nombre d'investisseurs distincts pour un
 * lot de projets, à partir des investissements SUCCESS.
 *
 * Exposé en Cloud Function plutôt qu'en requête Firestore directe côté client :
 * les règles de sécurité limitent la lecture d'un investissement à son
 * propriétaire ou à un admin (confidentialité financière entre investisseurs).
 * Le calcul se fait donc côté serveur avec l'Admin SDK — seuls les agrégats
 * sont renvoyés, jamais les investissements individuels (montant, identité).
 * Un seul appel prend un lot de projets pour éviter le N+1 (un round-trip par
 * carte projet affichée).
 */
export const getProjectsFundingStats = onCall<FundingStatsRequest>(
  { region: 'europe-west1' },
  async (request): Promise<FundingStatsResult> => {
    const { projectIds } = request.data;
    if (!Array.isArray(projectIds) || projectIds.length === 0) {
      throw new HttpsError('invalid-argument', 'projectIds requis (tableau non vide).');
    }
    if (projectIds.length > MAX_PROJECT_IDS) {
      throw new HttpsError('invalid-argument', `Maximum ${MAX_PROJECT_IDS} projets par appel.`);
    }

    const db = getFirestore();
    const snap = await db
      .collection('investments')
      .where('projectId', 'in', projectIds)
      .where('status', '==', 'SUCCESS')
      .get();

    const result: FundingStatsResult = {};
    for (const id of projectIds) {
      result[id] = { collectedAmount: 0, currentInvestors: 0 };
    }

    const investorsByProject = new Map<string, Set<string>>();
    snap.docs.forEach((doc) => {
      const data = doc.data();
      const projectId = data.projectId as string;
      const stats = result[projectId];
      if (!stats) return;
      stats.collectedAmount += data.amount ?? 0;

      if (!investorsByProject.has(projectId)) investorsByProject.set(projectId, new Set());
      if (data.userId) investorsByProject.get(projectId)!.add(data.userId);
    });

    for (const [projectId, investorIds] of investorsByProject) {
      result[projectId].currentInvestors = investorIds.size;
    }

    return result;
  }
);
