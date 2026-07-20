import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from '@react-native-firebase/firestore';
import { db } from './firebase';
import { User, RegisterDTO, KycStatus } from '../types';

/**
 * Récupère le profil utilisateur depuis Firestore.
 * Retourne null si l'utilisateur n'a pas encore de profil (nouvel inscrit).
 */
export async function getUser(uid: string): Promise<User | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: uid, ...snap.data() } as User;
}

/**
 * Crée le profil d'un nouvel investisseur après vérification OTP.
 */
export async function createUserProfile(uid: string, dto: RegisterDTO): Promise<User> {
  const newUser: Omit<User, 'id'> = {
    name: dto.name.trim(),
    email: dto.email.trim().toLowerCase(),
    phone: dto.phone,
    role: 'INVESTOR',
    kycStatus: 'NONE',
    createdAt: serverTimestamp() as any,
  };

  await setDoc(doc(db, 'users', uid), newUser);
  return { id: uid, ...newUser };
}

/**
 * Met à jour le statut KYC d'un utilisateur.
 */
export async function updateUserKycStatus(
  uid: string,
  status: KycStatus,
  rejectionReason?: string
): Promise<void> {
  await updateDoc(doc(db, 'users', uid), {
    kycStatus: status,
    ...(rejectionReason ? { kycRejectionReason: rejectionReason } : {}),
  });
}
