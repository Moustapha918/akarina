import { doc, getDoc, setDoc, updateDoc, serverTimestamp, Timestamp } from '@react-native-firebase/firestore';
import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { db, storage } from './firebase';
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
 * Upload la photo de profil vers Firebase Storage et retourne son URL.
 */
async function uploadProfilePhoto(uid: string, localUri: string): Promise<string> {
  const filePath = `profile/${uid}/photo_${Date.now()}.jpg`;
  const storageRef = ref(storage, filePath);
  await putFile(storageRef, localUri, { contentType: 'image/jpeg' });
  return getDownloadURL(storageRef);
}

/**
 * Crée le profil d'un nouvel investisseur après vérification OTP.
 */
export async function createUserProfile(uid: string, dto: RegisterDTO): Promise<User> {
  const photoUrl = dto.photoUri ? await uploadProfilePhoto(uid, dto.photoUri) : undefined;
  const address = dto.address?.trim();

  const newUser: Omit<User, 'id'> = {
    firstName: dto.firstName.trim(),
    lastName: dto.lastName.trim(),
    email: dto.email.trim().toLowerCase(),
    phone: dto.phone,
    dateOfBirth: Timestamp.fromDate(dto.dateOfBirth),
    role: 'INVESTOR',
    kycStatus: 'NONE',
    createdAt: serverTimestamp() as any,
    ...(address ? { address } : {}),
    ...(photoUrl ? { photoUrl } : {}),
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
