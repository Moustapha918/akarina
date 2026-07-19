import { useCallback } from 'react';
import { Alert, NativeModules } from 'react-native';
import { useTranslation } from 'react-i18next';
import { applyRTL, saveLanguage, LanguageCode } from '../i18n';

/**
 * Hook for switching the app language at runtime.
 *
 * When RTL direction changes (FR↔AR):
 *   - Language is persisted to AsyncStorage FIRST (so initI18n reads it on reload)
 *   - I18nManager.forceRTL() is called to set the native flag
 *   - NativeModules.DevSettings.reload() triggers a JS bundle reload (Expo Go
 *     and debug builds) — this re-runs initI18n() which applies the saved
 *     language + RTL flag, giving a full RTL layout with no manual restart
 *   - Production fallback (DevSettings not available): translations update
 *     immediately, RTL layout requires a manual close + reopen
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
        // Trigger a JS bundle reload. In Expo Go and debug builds,
        // DevSettings.reload() restarts the JS runtime while keeping the native
        // shell alive. I18nManager.forceRTL() is already set at the native level,
        // so initI18n() on the next run will find the flag and render full RTL.
        if (NativeModules.DevSettings?.reload) {
          NativeModules.DevSettings.reload();
          return; // reload takes care of everything else
        }

        // Production builds without expo-updates: update translations now and
        // ask the user to close + reopen for the layout direction to flip.
        await i18n.changeLanguage(lang);
        const isAr = lang === 'ar';
        Alert.alert(
          isAr ? 'إعادة تشغيل مطلوبة' : 'Redémarrage requis',
          isAr
            ? 'أغلق التطبيق وأعد فتحه لتفعيل تخطيط اللغة العربية.'
            : "Fermez et rouvrez l'application pour activer la mise en page arabe.",
          [{ text: isAr ? 'حسناً' : 'OK' }]
        );
        return;
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
