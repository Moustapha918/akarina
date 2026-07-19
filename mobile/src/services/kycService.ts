import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

  // XMLHttpRequest avec responseType 'blob' est la seule méthode fiable
  // pour lire des URI locaux (file:// et content://) dans React Native / Hermes.
  // fetch().blob() et uploadString(base64) échouent tous les deux sur Hermes.
  const blob = await new Promise<Blob>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.onload = () => resolve(xhr.response as Blob);
    xhr.onerror = () => reject(new Error('Impossible de lire le fichier image.'));
    xhr.responseType = 'blob';
    xhr.open('GET', localUri, true);
    xhr.send(null);
  });

  await uploadBytes(storageRef, blob, { contentType: 'image/jpeg' });

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
