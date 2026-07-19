import { View, ActivityIndicator } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../src/hooks/useAuthStore';
import { useOnboarding } from '../src/hooks/useOnboarding';
import { COLORS } from '../src/constants';

export default function Index() {
  const { isLoading: authLoading } = useAuthStore();
  const { isLoading: onboardingLoading, isDone } = useOnboarding();

  // Attendre uniquement la lecture du SecureStore pour décider de l'onboarding
  if (onboardingLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  // 1ère visite → onboarding obligatoire (pas besoin de connaître l'état auth)
  if (!isDone) {
    return <Redirect href="/onboarding" />;
  }

  // Onboarding déjà vu : attendre la résolution Firebase avant d'aller dans l'app
  if (authLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.primary }}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  return <Redirect href="/(app)" />;
}
