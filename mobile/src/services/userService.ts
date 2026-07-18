import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { User, RegisterDTO } from '../types';

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
