import * as Print from 'expo-print';
import { ref, putFile, getDownloadURL } from '@react-native-firebase/storage';
import { storage } from '../services/firebase';

/**
 * Génère un PDF à partir du HTML, l'uploade vers Firebase Storage
 * sous contracts/{investmentId}.pdf et retourne l'URL de téléchargement publique.
 */
export async function uploadContractPDF(
  html: string,
  investmentId: string,
  userId: string,
): Promise<string> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  const storageRef = ref(storage, `contracts/${userId}/${investmentId}.pdf`);
  await putFile(storageRef, uri, { contentType: 'application/pdf' });

  return getDownloadURL(storageRef);
}
