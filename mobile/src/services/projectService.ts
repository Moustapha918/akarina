import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  Query,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Project, ProjectStatus, ProjectUpdate } from '../types';

function toProject(id: string, data: DocumentData): Project {
  return { id, ...data } as Project;
}

/**
 * Récupère tous les projets, triés par date de création décroissante.
 * Filtre optionnel par statut.
 */
export async function getProjects(status?: ProjectStatus): Promise<Project[]> {
  let q: Query<DocumentData> = query(
    collection(db, 'projects'),
    orderBy('createdAt', 'desc')
  );

  if (status) {
    q = query(
      collection(db, 'projects'),
      where('status', '==', status),
      orderBy('createdAt', 'desc')
    );
  }

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
