import { useCallback } from 'react';
import { reloadAppAsync } from 'expo';
import { useTranslation } from 'react-i18next';
import { applyRTL, saveLanguage, LanguageCode } from '../i18n';

/**
 * Hook for switching the app language at runtime.
 *
 * When RTL direction changes (FR↔AR):
 *   - Language is persisted to AsyncStorage FIRST (so initI18n reads it on reload)
 *   - I18nManager.forceRTL() is called to set the native flag
 *   - reloadAppAsync() (from the base `expo` package, not expo-updates) reloads
 *     the JS bundle in place across Expo Go, dev builds, and release builds —
 *     this re-runs initI18n() which applies the saved language + RTL flag.
 *     Do NOT use NativeModules.DevSettings.reload(): on iOS it can leave the
 *     Expo native module registry (ExponentConstants, ExpoAsset, ...) out of
 *     sync with the fresh JS context, causing "Cannot find native module" and
 *     "main has not been registered" crashes.
 *
 * When no RTL change (e.g. future third LTR language):
 *   - Translations swap immediately via i18n.changeLanguage(), no reload needed
 */
export function useLanguageSwitcher() {
  const { i18n } = useTranslation();

  const switchLanguage = useCallback(
    async (lang: LanguageCode) => {
      if (i18n.language === lang) return;

      // 1. Persist BEFORE any reload so initI18n() reads the new lang on restart.
      await saveLanguage(lang);

      // 2. Apply native RTL flag — returns true if direction changed (FR↔AR).
      const needsRTLReload = applyRTL(lang);

      if (needsRTLReload) {
        // I18nManager.forceRTL() is already set at the native level, so
        // initI18n() on the next run will find the flag and render full RTL.
        await reloadAppAsync();
        return; // reload takes care of everything else
      }

      // No RTL direction change — swap translations immediately, no reload needed.
      await i18n.changeLanguage(lang);
    },
    [i18n]
  );

  return {
    currentLang: i18n.language as LanguageCode,
    switchLanguage,
  };
}
