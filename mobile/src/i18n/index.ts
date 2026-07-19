import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const LANGUAGE_KEY = 'app_language';
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabe', nativeLabel: 'العربية' },
] as const;
export type LanguageCode = 'fr' | 'ar';

export async function getSavedLanguage(): Promise<LanguageCode> {
  try {
    const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
    if (saved === 'ar' || saved === 'fr') return saved;
  } catch {}
  return 'fr';
}

export async function saveLanguage(lang: LanguageCode): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
}

export async function initI18n(): Promise<void> {
  const lang = await getSavedLanguage();

  await i18n
    .use(initReactI18next)
    .init({
      resources: {
        fr: { translation: fr },
        ar: { translation: ar },
      },
      lng: lang,
      fallbackLng: 'fr',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
}

export default i18n;
