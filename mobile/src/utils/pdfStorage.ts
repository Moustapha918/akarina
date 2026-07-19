import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { storage } from '../services/firebase';

/**
 * Génère un PDF à partir du HTML, l'uploade vers Firebase Storage
 * sous contracts/{investmentId}.pdf et retourne l'URL de téléchargement publique.
 */
export async function uploadContractPDF(
  html: string,
  investmentId: string,
): Promise<string> {
  // 1. Générer le PDF localement
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  // 2. Lire en base64
  const base64 = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.Base64,
  });

  // 3. Uploader vers Firebase Storage
  const storageRef = ref(storage, `contracts/${investmentId}.pdf`);
  await uploadString(storageRef, base64, 'base64', {
    contentType: 'application/pdf',
  });

  // 4. Retourner l'URL publique
  return getDownloadURL(storageRef);
}
