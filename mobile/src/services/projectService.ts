import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  DocumentData,
} from '@react-native-firebase/firestore';
import { db } from './firebase';
import { Project, ProjectUpdate } from '../types';

function toProject(id: string, data: DocumentData): Project {
  return { id, ...data } as Project;
}

/**
 * Récupère tous les projets. Le tri et le filtrage par type sont faits côté client.
 */
export async function getProjects(): Promise<Project[]> {
  const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toProject(d.id, d.data()));
}

/**
 * Récupère un projet par son ID.
 */
export async function getProject(id: string): Promise<Project | null> {
  const snap = await getDoc(doc(db, 'projects', id));
  if (!snap.exists()) return null;
  return toProject(snap.id, snap.data());
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
