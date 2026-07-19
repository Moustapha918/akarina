import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { I18nextProvider } from 'react-i18next';
import { useAuthStore } from '../src/hooks/useAuthStore';
import i18n, { initI18n } from '../src/i18n';

export default function RootLayout() {
  const { initialize } = useAuthStore();
  const [i18nReady, setI18nReady] = useState(false);

  useEffect(() => {
    initialize();
    // initI18n() calls applyRTL() → I18nManager.forceRTL() before this
    // component renders, so the native layout engine and React Navigation's
    // Stack (slide direction, swipe-back gesture, header back button) are
    // all configured correctly for the saved language on first paint.
    initI18n().then(() => setI18nReady(true));
  }, []);

  if (!i18nReady) return null;

  return (
    <I18nextProvider i18n={i18n}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <Stack screenOptions={{ headerShown: false }} />
      </SafeAreaProvider>
    </I18nextProvider>
  );
}
