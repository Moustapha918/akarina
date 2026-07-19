import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AdminGuard } from '../../src/components/ui/AdminGuard';
import { COLORS } from '../../src/constants';

export default function AdminLayout() {
  const insets = useSafeAreaInsets();

  return (
    <AdminGuard>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: COLORS.textSecondary,
          tabBarStyle: {
            backgroundColor: COLORS.primary,
            borderTopColor: 'rgba(255,255,255,0.15)',
            paddingBottom: insets.bottom || 8,
            height: 64 + (insets.bottom || 0),
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
          tabBarActiveTintColor: COLORS.secondary,
          tabBarInactiveTintColor: 'rgba(255,255,255,0.5)',
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="stats-chart-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="kyc"
          options={{
            title: 'KYC',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="shield-checkmark-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="projects"
          options={{
            title: 'Projets',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="business-outline" size={size} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="investments"
          options={{
            title: 'Investissements',
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="wallet-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
    </AdminGuard>
  );
}
