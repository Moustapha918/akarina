import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { COLORS } from '../../src/constants';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textSecondary,
        tabBarStyle: {
          backgroundColor: COLORS.surface,
          borderTopColor: COLORS.border,
          paddingBottom: 8,
          height: 64,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Projets',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="business-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="dashboard/index"
        options={{
          title: 'Portfolio',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="pie-chart-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="kyc/index"
        options={{
          title: 'KYC',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="shield-checkmark-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile/index"
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
      {/* Routes cachées de la tab bar */}
      <Tabs.Screen name="project/[id]" options={{ href: null }} />
      <Tabs.Screen name="invest/[id]/amount" options={{ href: null }} />
      <Tabs.Screen name="invest/[id]/contract" options={{ href: null }} />
      <Tabs.Screen name="invest/[id]/payment" options={{ href: null }} />
      <Tabs.Screen name="invest/[id]/confirmation" options={{ href: null }} />
    </Tabs>
  );
}
