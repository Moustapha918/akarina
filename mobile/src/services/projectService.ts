import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  DocumentData,
} from '@react-native-firebase/firestore';
import { httpsCallable } from '@react-native-firebase/functions';
import { db } from './firebase';
import { functionsInstance } from './functionsClient';
import { Project, ProjectUpdate } from '../types';

/** Doit rester aligné avec MAX_PROJECT_IDS dans functions/src/projects/fundingStats.ts. */
const FUNDING_STATS_BATCH_SIZE = 30;

interface FundingStats {
  collectedAmount: number;
  currentInvestors: number;
}

function toProject(id: string, data: DocumentData): Project {
  return { id, ...data } as Project;
}

/**
 * `collectedAmount`/`currentInvestors` stockés sur le document ne sont pas fiables
 * (aucune écriture ne les maintient) — on les recalcule à la volée depuis les
 * investissements SUCCESS, via une Cloud Function : les règles Firestore
 * interdisent au client de lire les investissements d'autres utilisateurs
 * (confidentialité financière), donc ce calcul ne peut pas se faire en requête
 * directe côté mobile.
 */
async function fetchFundingStats(projectIds: string[]): Promise<Record<string, FundingStats>> {
  if (projectIds.length === 0) return {};

  const call = httpsCallable<{ projectIds: string[] }, Record<string, FundingStats>>(
    functionsInstance,
    'getProjectsFundingStats'
  );

  const batches: string[][] = [];
  for (let i = 0; i < projectIds.length; i += FUNDING_STATS_BATCH_SIZE) {
    batches.push(projectIds.slice(i, i + FUNDING_STATS_BATCH_SIZE));
  }

  const results = await Promise.all(batches.map((batch) => call({ projectIds: batch })));
  return results.reduce((acc, { data }) => ({ ...acc, ...data }), {});
}

function applyFundingStats(project: Project, stats: Record<string, FundingStats>): Project {
  const projectStats = stats[project.id] ?? { collectedAmount: 0, currentInvestors: 0 };
  return { ...project, ...projectStats };
}

/**
 * Récupère tous les projets. Le tri et le filtrage par type sont faits côté client.
 */
export async function getProjects(): Promise<Project[]> {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  const projects = snap.docs.map((d) => toProject(d.id, d.data()));
  const stats = await fetchFundingStats(projects.map((p) => p.id));
  return projects.map((p) => applyFundingStats(p, stats));
}

/**
 * Récupère un projet par son ID.
 */
export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', id));
  if (!snap.exists()) return null;
  const project = toProject(snap.id, snap.data());
  const stats = await fetchFundingStats([id]);
  return applyFundingStats(project, stats);
}

/**
 * Récupère les actualités d'un projet (photos, vidéos chantier).
 */
export async function getProjectUpdates(projectId: string): Promise<ProjectUpdate[]> {
  const q = query(
    collection(db, 'projects', projectId, 'updates'),
    orderBy('publishedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as ProjectUpdate));
}
