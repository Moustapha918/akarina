import { useCallback } from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { applyRTL, saveLanguage, LanguageCode } from '../i18n';

/**
 * Hook for switching the app language at runtime.
 *
 * - String translations update immediately (no restart needed).
 * - If the RTL layout direction changes (FR↔AR), the user is prompted to
 *   restart the app so React Native's layout engine can re-initialise.
 *   Text direction is applied eagerly via I18nManager so the next cold
 *   start is already correct without any user action on the JS side.
 */
export function useLanguageSwitcher() {
  const { i18n } = useTranslation();

  const switchLanguage = useCallback(
    async (lang: LanguageCode) => {
      if (i18n.language === lang) return;

      // 1. Persist choice so initI18n() picks it up on next launch.
      await saveLanguage(lang);

      // 2. Swap translations immediately — all t() calls re-render.
      await i18n.changeLanguage(lang);

      // 3. Update I18nManager RTL flag. Returns true if the direction
      //    actually changed (FR→AR or AR→FR), which requires a restart
      //    for the layout engine and navigation stack to reflect it.
      const needsRestart = applyRTL(lang);

      if (needsRestart) {
        const isAr = lang === 'ar';
        Alert.alert(
          isAr ? 'إعادة تشغيل مطلوبة' : 'Redémarrage requis',
          isAr
            ? 'أغلق التطبيق وأعد فتحه لتفعيل تخطيط اللغة العربية.'
            : "Fermez et rouvrez l'application pour activer la mise en page arabe.",
          [{ text: isAr ? 'حسناً' : 'OK' }]
        );
      }
    },
    [i18n]
  );

  return {
    currentLang: i18n.language as LanguageCode,
    switchLanguage,
  };
}
