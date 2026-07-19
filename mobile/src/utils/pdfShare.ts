import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Génère un PDF à partir d'un template HTML et ouvre le dialogue de partage.
 * Gère la différence Android (file:// → content://) / iOS.
 */
export async function sharePDF(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  let shareUri = uri;

  if (Platform.OS === 'android') {
    // Android 7+ ne peut pas partager une URI file:// entre apps.
    // getContentUriAsync() la convertit en content:// via FileProvider.
    shareUri = await FileSystem.getContentUriAsync(uri);
  }

  await Sharing.shareAsync(shareUri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
    UTI: 'com.adobe.pdf',
  });
}
