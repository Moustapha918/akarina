import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nManager } from 'react-native';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

export const LANGUAGE_KEY = 'app_language';
export const SUPPORTED_LANGUAGES = [
  { code: 'fr', label: 'Français', nativeLabel: 'Français' },
  { code: 'ar', label: 'Arabe', nativeLabel: 'العربية' },
] as const;
export type LanguageCode = 'fr' | 'ar';

/**
 * Apply RTL layout direction for the given language.
 * Returns true if the RTL state changed — the caller should prompt a restart
 * so that React Native fully re-initialises the layout engine.
 */
export function applyRTL(lang: LanguageCode): boolean {
  const shouldBeRTL = lang === 'ar';
  if (I18nManager.isRTL !== shouldBeRTL) {
    I18nManager.allowRTL(shouldBeRTL);
    I18nManager.forceRTL(shouldBeRTL);
    return true; // restart needed for full effect
  }
  return false;
}

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

  // Apply RTL before the first render so the layout engine is configured correctly.
  applyRTL(lang);

  if (i18n.isInitialized) {
    // Fast Refresh keeps the singleton alive — just switch language, skip init().
    await i18n.changeLanguage(lang);
    return;
  }

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
