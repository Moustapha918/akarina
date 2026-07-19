import { View, Text, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuthStore } from '../../hooks/useAuthStore';
import { COLORS } from '../../constants';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthStore();

  if (isLoading) return null;

  if (!user) return <Redirect href="/(auth)/login" />;

  if (user.role !== 'ADMIN') {
    return (
      <View style={styles.container}>
        <Text style={styles.icon}>🚫</Text>
        <Text style={styles.title}>Accès refusé</Text>
        <Text style={styles.text}>Cette section est réservée aux administrateurs.</Text>
      </View>
    );
  }

  return <>{children}</>;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 32,
  },
  icon: { fontSize: 48, marginBottom: 16 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  text: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center' },
});
