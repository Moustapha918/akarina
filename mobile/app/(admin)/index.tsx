import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAdminStats, AdminStats } from '../../src/services/adminService';
import { useAuthStore } from '../../src/hooks/useAuthStore';
import { formatMRU } from '../../src/utils/format';
import { COLORS } from '../../src/constants';

function StatCard({
  icon, label, value, color, onPress,
}: {
  icon: string; label: string; value: string; color?: string; onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.statCard}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Text style={styles.statIcon}>{icon}</Text>
      <Text style={[styles.statValue, color ? { color } : {}]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

export default function AdminDashboard() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setStats(await getAdminStats());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.secondary} />}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.badge}>⚙ ADMIN</Text>
        <Text style={styles.title}>Back-office</Text>
        <Text style={styles.subtitle}>Bonjour, {user?.name?.split(' ')[0]}</Text>
      </View>

      {/* Stats */}
      <View style={styles.grid}>
        <StatCard
          icon="⏳"
          label="KYC en attente"
          value={stats ? String(stats.pendingKyc) : '—'}
          color={stats?.pendingKyc ? COLORS.warning : COLORS.success}
          onPress={() => router.push('/(admin)/kyc')}
        />
        <StatCard
          icon="💰"
          label="Investissements"
          value={stats ? String(stats.totalInvestments) : '—'}
          onPress={() => router.push('/(admin)/investments')}
        />
        <StatCard
          icon="📈"
          label="Total collecté"
          value={stats ? formatMRU(stats.totalCollected, true) : '—'}
          color={COLORS.success}
        />
        <StatCard
          icon="🏗"
          label="Projets ouverts"
          value={stats ? String(stats.openProjects) : '—'}
          onPress={() => router.push('/(admin)/projects')}
        />
      </View>

      {/* Actions rapides */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Actions rapides</Text>
        {[
          { icon: '🪪', label: 'Valider les KYC en attente', route: '/(admin)/kyc' },
          { icon: '➕', label: 'Créer un nouveau projet', route: '/(admin)/projects' },
          { icon: '📊', label: 'Voir tous les investissements', route: '/(admin)/investments' },
        ].map((item) => (
          <TouchableOpacity
            key={item.route}
            style={styles.actionRow}
            onPress={() => router.push(item.route as any)}
          >
            <Text style={styles.actionIcon}>{item.icon}</Text>
            <Text style={styles.actionLabel}>{item.label}</Text>
            <Text style={styles.actionChevron}>›</Text>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 32 },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  badge: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.secondary,
    letterSpacing: 1.5,
    marginBottom: 8,
  },
  title: { fontSize: 26, fontWeight: '800', color: '#fff' },
  subtitle: { fontSize: 14, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    padding: 16,
    marginTop: -12,
  },
  statCard: {
    width: '47%',
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  statIcon: { fontSize: 28, marginBottom: 8 },
  statValue: { fontSize: 22, fontWeight: '800', color: COLORS.primary, marginBottom: 4 },
  statLabel: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
  section: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 14, fontWeight: '500', color: COLORS.textPrimary },
  actionChevron: { fontSize: 20, color: COLORS.border },
});
