import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentData,
} from '@react-native-firebase/firestore';
import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { db, storage } from './firebase';
import { updateUserKycStatus } from './userService';
import { Document, DocType } from '../types';

function toDocument(id: string, data: DocumentData): Document {
  return { id, ...data } as Document;
}

/**
 * Upload une image vers Firebase Storage.
 * Retourne le chemin Storage et l'URL de téléchargement.
 */
async function uploadImage(
  userId: string,
  side: 'front' | 'back',
  localUri: string
): Promise<{ filePath: string; downloadUrl: string }> {
  const filePath = `kyc/${userId}/${side}_${Date.now()}.jpg`;
  const storageRef = ref(storage, filePath);

  await putFile(storageRef, localUri, { contentType: 'image/jpeg' });

  const downloadUrl = await getDownloadURL(storageRef);
  return { filePath, downloadUrl };
}

/**
 * Soumet les deux faces de la pièce d'identité :
 *  - Upload des images vers Firebase Storage
 *  - Sauvegarde dans la collection `documents`
 *  - Passe kycStatus de l'utilisateur à PENDING
 */
export async function submitKycDocuments(
  userId: string,
  docType: DocType,
  frontUri: string,
  backUri: string
): Promise<void> {
  const [front, back] = await Promise.all([
    uploadImage(userId, 'front', frontUri),
    uploadImage(userId, 'back', backUri),
  ]);

  await Promise.all([
    addDoc(collection(db, 'documents'), {
      userId,
      docType,
      side: 'FRONT',
      filePath: front.filePath,
      downloadUrl: front.downloadUrl,
      isVerified: false,
      uploadedAt: serverTimestamp(),
    }),
    addDoc(collection(db, 'documents'), {
      userId,
      docType,
      side: 'BACK',
      filePath: back.filePath,
      downloadUrl: back.downloadUrl,
      isVerified: false,
      uploadedAt: serverTimestamp(),
    }),
  ]);

  await updateUserKycStatus(userId, 'PENDING');
}

/**
 * Récupère les documents KYC soumis par un utilisateur.
 */
export async function getKycDocuments(userId: string): Promise<Document[]> {
  const q = query(
    collection(db, 'documents'),
    where('userId', '==', userId),
    orderBy('uploadedAt', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => toDocument(d.id, d.data()));
}
