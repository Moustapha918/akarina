import {
  collection,
  addDoc,
  doc,
  getDoc,
  updateDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { db } from './firebase';
import { Investment, InvestmentStatus, CreateInvestmentDTO } from '../types';

function toInvestment(id: string, data: DocumentData): Investment {
  return { id, ...data } as Investment;
}

/** Crée un investissement PENDING en Firestore. */
export async function createInvestment(
  dto: CreateInvestmentDTO,
  userId: string
): Promise<Investment> {
  const ref = await addDoc(collection(db, 'investments'), {
    userId,
    projectId: dto.projectId,
    amount: dto.amount,
    status: 'PENDING' as InvestmentStatus,
    createdAt: serverTimestamp(),
  });
  const snap = await getDoc(ref);
  return toInvestment(ref.id, snap.data()!);
}

/** Enregistre l'acceptation du contrat. */
export async function markContractAccepted(investmentId: string): Promise<void> {
  await updateDoc(doc(db, 'investments', investmentId), {
    contractAcceptedAt: serverTimestamp(),
  });
}

/** Met à jour le statut après traitement du paiement. */
export async function updateInvestmentStatus(
  investmentId: string,
  status: InvestmentStatus,
  extras?: {
    bankilyRef?: string;
    contractUrl?: string;
  }
): Promise<void> {
  await updateDoc(doc(db, 'investments', investmentId), {
    status,
    ...(status === 'SUCCESS' ? { paidAt: serverTimestamp() } : {}),
    ...extras,
  });
}

/** Récupère un investissement par son ID. */
export async function getInvestment(investmentId: string): Promise<Investment | null> {
  const snap = await getDoc(doc(db, 'investments', investmentId));
  if (!snap.exists()) return null;
  return toInvestment(snap.id, snap.data());
}

/** Récupère tous les investissements d'un utilisateur. */
export async function getInvestmentsByUser(userId: string): Promise<Investment[]> {
  const q = query(
    collection(db, 'investments'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toInvestment(d.id, d.data()));
}
