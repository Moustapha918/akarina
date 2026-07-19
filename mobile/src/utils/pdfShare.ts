import { Platform } from 'react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import * as FileSystem from 'expo-file-system/legacy';

/** Supprime les espaces et caractères spéciaux pour un nom de fichier propre. */
function slugify(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // retire les accents
    .replace(/[^a-zA-Z0-9]/g, '');  // garde uniquement alphanumérique
}

/** Génère le nom de fichier : NomProjetNomInvestisseurJJMMAAAA.pdf */
export function buildPDFFilename(projectTitle: string, userName: string): string {
  const now = new Date();
  const dd = String(now.getDate()).padStart(2, '0');
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const yyyy = String(now.getFullYear());
  return `${slugify(projectTitle)}${slugify(userName)}${dd}${mm}${yyyy}.pdf`;
}

/**
 * Génère un PDF à partir d'un template HTML et ouvre le dialogue de partage.
 *
 * Android : copie le fichier vers documentDirectory (accessible par FileProvider)
 *   avant conversion en content://, avec fallback sur Print.printAsync.
 * iOS : partage directement le file:// retourné par printToFileAsync.
 */
export async function sharePDF(html: string, filename: string): Promise<void> {
  const { uri } = await Print.printToFileAsync({ html, base64: false });

  if (Platform.OS === 'android') {
    try {
      const destUri = `${FileSystem.documentDirectory}${filename}`;
      await FileSystem.copyAsync({ from: uri, to: destUri });
      const contentUri = await FileSystem.getContentUriAsync(destUri);
      await Sharing.shareAsync(contentUri, {
        mimeType: 'application/pdf',
        dialogTitle: filename,
      });
    } catch {
      await Print.printAsync({ html });
    }
    return;
  }

  // iOS : renommer le fichier avant de partager
  const destUri = `${FileSystem.documentDirectory}${filename}`;
  await FileSystem.copyAsync({ from: uri, to: destUri });
  await Sharing.shareAsync(destUri, {
    mimeType: 'application/pdf',
    dialogTitle: filename,
    UTI: 'com.adobe.pdf',
  });
}
