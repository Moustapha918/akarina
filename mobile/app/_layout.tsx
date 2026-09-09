import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { useAuthStore } from '../src/hooks/useAuthStore';
import { initFeatureFlags } from '../src/services/featureFlags';
import i18n, { initI18n } from '../src/i18n';

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    let active = true;
    initialize();
    // Best-effort, ne bloque pas le rendu : les écrans qui lisent un flag via
    // useFeatureFlags() retombent sur les valeurs par défaut tant que ce fetch
    // n'a pas abouti.
    initFeatureFlags().catch(() => {});
    // initI18n() calls applyRTL() → I18nManager.forceRTL() before this
    // component renders, so the native layout engine and React Navigation's
    // Stack (slide direction, swipe-back gesture, header back button) are
    // all configured correctly for the saved language on first paint.
    initI18n().then(() => {
      if (active) setI18nReady(true);
    });
    return () => { active = false; };
  }, []);

  // I18nextProvider must be mounted before i18n.init() resolves so that
  // initReactI18next can update its context without triggering the
  // "state update on an unmounted component" warning.
  // The Stack (app content) is withheld until i18n is ready to avoid any
  // flash of untranslated strings.
  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        {i18nReady && <Stack screenOptions={{ headerShown: false }} />}
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
