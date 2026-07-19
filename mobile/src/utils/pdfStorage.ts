import * as Print from 'expo-print';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

/**
 * Génère un PDF à partir du HTML, l'uploade vers Firebase Storage
 * sous contracts/{investmentId}.pdf et retourne l'URL de téléchargement publique.
 *
 * Note: on utilise fetch() + uploadBytes() au lieu de uploadString('base64')
 * car le SDK Firebase Web utilise ArrayBuffer en interne, non supporté dans RN.
 */
export async function uploadContractPDF(
  html: string,
  investmentId: string,
  userId: string,
): Promise<string> {
  // 1. Générer le PDF localement
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // 2. Convertir le file:// URI en Blob via fetch (polyfill natif RN)
  const response = await fetch(uri);
  const blob = await response.blob();

  // 3. Uploader vers Firebase Storage — path : contracts/{userId}/{investmentId}.pdf
  const storageRef = ref(storage, `contracts/${userId}/${investmentId}.pdf`);
  await uploadBytes(storageRef, blob, { contentType: 'application/pdf' });

  // 4. Retourner l'URL publique
  return getDownloadURL(storageRef);
}
