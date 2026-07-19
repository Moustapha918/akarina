import {
  collection,
  query,
  where,
  orderBy,
  getDocs,
  getDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  DocumentData,
  Timestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { User, Project, Investment, Document, KycStatus, ProjectStatus } from '../types';
import { updateUserKycStatus } from './userService';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface KycSubmission {
  user: User;
  documents: Document[];
}

export interface AdminStats {
  pendingKyc: number;
  totalInvestments: number;
  totalCollected: number;
  openProjects: number;
}

export interface CreateProjectDTO {
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  roiEstimate: number;
  roiDurationMonths: number;
  minInvestment: number;
  maxInvestors: number;
  coverImageUrl: string;
}

// ─── Stats ────────────────────────────────────────────────────────────────────

export async function getAdminStats(): Promise<AdminStats> {
  const [kycSnap, investSnap, projectSnap] = await Promise.all([
    getDocs(query(collection(db, 'users'), where('kycStatus', '==', 'PENDING'))),
    getDocs(query(collection(db, 'investments'), where('status', '==', 'SUCCESS'))),
    getDocs(query(collection(db, 'projects'), where('status', '==', 'OPEN'))),
  ]);

  const totalCollected = investSnap.docs.reduce(
    (sum, d) => sum + (d.data().amount ?? 0), 0
  );

  return {
    pendingKyc: kycSnap.size,
    totalInvestments: investSnap.size,
    totalCollected,
    openProjects: projectSnap.size,
  };
}

// ─── KYC ─────────────────────────────────────────────────────────────────────

export async function getPendingKycSubmissions(): Promise<KycSubmission[]> {
  const usersSnap = await getDocs(
    query(collection(db, 'users'), where('kycStatus', '==', 'PENDING'))
  );

  const submissions = await Promise.all(
    usersSnap.docs.map(async (d) => {
      const user = { id: d.id, ...d.data() } as User;
      const docsSnap = await getDocs(
        query(collection(db, 'documents'), where('userId', '==', user.id))
      );
      const documents = docsSnap.docs.map((dd) => ({ id: dd.id, ...dd.data() } as Document));
      return { user, documents };
    })
  );

  return submissions;
}

export async function approveKyc(userId: string): Promise<void> {
  await updateUserKycStatus(userId, 'VERIFIED');
  // Marquer tous les documents de l'utilisateur comme vérifiés
  const docsSnap = await getDocs(
    query(collection(db, 'documents'), where('userId', '==', userId))
  );
  await Promise.all(
    docsSnap.docs.map((d) =>
      updateDoc(doc(db, 'documents', d.id), { isVerified: true, verifiedAt: serverTimestamp() })
    )
  );
}

export async function rejectKyc(userId: string, reason: string): Promise<void> {
  await updateUserKycStatus(userId, 'REJECTED', reason);
}

// ─── Projects ─────────────────────────────────────────────────────────────────

export async function getAllProjects(): Promise<Project[]> {
  const snap = await getDocs(
    query(collection(db, 'projects'), orderBy('createdAt', 'desc'))
  );
  return snap.docs.map((d) => ({ id: d.id, ...d.data() } as Project));
}

export async function createProject(dto: CreateProjectDTO): Promise<string> {
  const ref = await addDoc(collection(db, 'projects'), {
    ...dto,
    collectedAmount: 0,
    currentInvestors: 0,
    status: 'OPEN' as ProjectStatus,
    imageUrls: [],
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function updateProjectStatus(
  projectId: string,
  status: ProjectStatus
): Promise<void> {
  await updateDoc(doc(db, 'projects', projectId), {
    status,
    updatedAt: serverTimestamp(),
  });
}

export async function addProjectUpdate(
  projectId: string,
  title: string,
  description: string
): Promise<void> {
  await addDoc(collection(db, 'projects', projectId, 'updates'), {
    projectId,
    title,
    description,
    imageUrls: [],
    publishedAt: serverTimestamp(),
  });
}

// ─── Investments ──────────────────────────────────────────────────────────────

export async function getAllInvestments(): Promise<(Investment & { userName?: string })[]> {
  const snap = await getDocs(
    query(collection(db, 'investments'), orderBy('createdAt', 'desc'))
  );

  const investments = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Investment));

  // Récupère les noms d'utilisateurs en parallèle (dédupliqués)
  const userIds = [...new Set(investments.map((i) => i.userId))];
  const userMap = new Map<string, string>();
  await Promise.all(
    userIds.map(async (uid) => {
      const u = await getDoc(doc(db, 'users', uid));
      if (u.exists()) userMap.set(uid, u.data().name ?? uid);
    })
  );

  return investments.map((i) => ({ ...i, userName: userMap.get(i.userId) }));
}
