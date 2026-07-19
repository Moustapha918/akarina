import { View, Text, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants';
import { Button } from './Button';
import { useAuthStore } from '../../hooks/useAuthStore';

interface GuestGuardProps {
  children: React.ReactNode;
  icon?: string;
  title?: string;
  description?: string;
}

export function GuestGuard({
  children,
  icon = '🔒',
  title,
  description,
}: GuestGuardProps) {
  const { user } = useAuthStore();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();

  if (user) return <>{children}</>;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + 24 }]}>
      <Text style={styles.icon}>{icon}</Text>
      <Text style={styles.title}>{title ?? t('common.loginRequired')}</Text>
      <Text style={styles.description}>{description ?? t('common.loginPrompt')}</Text>
      <Button
        label={t('common.signIn')}
        onPress={() => router.push('/(auth)/login')}
        style={styles.button}
      />
      <Button
        label={t('common.createAccount')}
        onPress={() => router.push('/(auth)/login')}
        variant="outline"
        style={styles.buttonOutline}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    backgroundColor: COLORS.background,
    gap: 12,
  },
  icon: {
    fontSize: 56,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 8,
  },
  button: {
    width: '100%',
  },
  buttonOutline: {
    width: '100%',
  },
});
