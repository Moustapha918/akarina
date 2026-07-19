import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Génère un PDF à partir d'un template HTML et ouvre le dialogue de partage.
 *
 * Android : printToFileAsync enregistre dans le cache temporaire.
 *   getContentUriAsync exige un fichier dans documentDirectory ou cacheDirectory
 *   enregistré via le FileProvider de l'app. On copie donc explicitement le
 *   fichier dans documentDirectory avant conversion en content://.
 *   En cas d'échec du partage, on replie sur printAsync (impression native /
 *   "Enregistrer en PDF" du système Android).
 *
 * iOS : le file:// retourné par printToFileAsync est directement partageable.
 */
export async function sharePDF(html: string, dialogTitle: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (Platform.OS === 'android') {
    try {
      // Copier vers documentDirectory pour garantir l'accès FileProvider
      const destUri = `${FileSystem.documentDirectory}contrat-akarina-${Date.now()}.pdf`;
      await FileSystem.copyAsync({ from: uri, to: destUri });
      const contentUri = await FileSystem.getContentUriAsync(destUri);
      await Sharing.shareAsync(contentUri, {
        mimeType: 'application/pdf',
        dialogTitle,
      });
    } catch {
      // Fallback : boîte de dialogue d'impression Android (→ "Enregistrer en PDF")
      await Print.printAsync({ html });
    }
    return;
  }

  // iOS
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle,
    UTI: 'com.adobe.pdf',
  });
}
