import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getAllInvestments } from '../../src/services/adminService';
import { Investment } from '../../src/types';
import { formatMRU } from '../../src/utils/format';
import { COLORS } from '../../src/constants';

type InvestmentRow = Investment & { userName?: string };

const STATUS_COLORS: Record<string, string> = {
  SUCCESS: COLORS.success,
  PENDING: COLORS.warning,
  FAILED: COLORS.danger,
};
const STATUS_LABELS: Record<string, string> = {
  SUCCESS: 'Payé',
  PENDING: 'En attente',
  FAILED: 'Échoué',
};

function InvestmentCard({ inv }: { inv: InvestmentRow }) {
  const color = STATUS_COLORS[inv.status] ?? COLORS.textSecondary;
  const label = STATUS_LABELS[inv.status] ?? inv.status;
  const date = inv.createdAt?.toDate?.().toLocaleDateString('fr-FR') ?? '—';

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.userName} numberOfLines={1}>{inv.userName ?? inv.userId}</Text>
          <Text style={styles.projectId} numberOfLines={1}>Projet · {inv.projectId}</Text>
          <Text style={styles.date}>{date}</Text>
        </View>
        <View style={styles.right}>
          <Text style={styles.amount}>{formatMRU(inv.amount, true)}</Text>
          <View style={[styles.badge, { backgroundColor: color + '20' }]}>
            <Text style={[styles.badgeText, { color }]}>{label}</Text>
          </View>
        </View>
      </View>
      {inv.bankilyRef ? (
        <Text style={styles.ref}>Réf. Bankily : {inv.bankilyRef}</Text>
      ) : null}
    </View>
  );
}

export default function AdminInvestments() {
  const insets = useSafeAreaInsets();
  const [investments, setInvestments] = useState<InvestmentRow[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setInvestments(await getAllInvestments());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalSuccess = investments.filter((i) => i.status === 'SUCCESS');
  const totalCollected = totalSuccess.reduce((s, i) => s + i.amount, 0);

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.secondary} />}
    >
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Investissements</Text>
        <View style={styles.headerStats}>
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{investments.length}</Text>
            <Text style={styles.headerStatLabel}>Total</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{totalSuccess.length}</Text>
            <Text style={styles.headerStatLabel}>Payés</Text>
          </View>
          <View style={styles.separator} />
          <View style={styles.headerStat}>
            <Text style={styles.headerStatValue}>{formatMRU(totalCollected, true)}</Text>
            <Text style={styles.headerStatLabel}>Collecté</Text>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        {loading && investments.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : investments.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💸</Text>
            <Text style={styles.emptyTitle}>Aucun investissement</Text>
          </View>
        ) : (
          investments.map((inv) => <InvestmentCard key={inv.id} inv={inv} />)
        )}
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
    paddingBottom: 20,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff', marginBottom: 16 },
  headerStats: { flexDirection: 'row', alignItems: 'center' },
  headerStat: { flex: 1, alignItems: 'center' },
  headerStatValue: { fontSize: 16, fontWeight: '800', color: '#fff' },
  headerStatLabel: { fontSize: 11, color: 'rgba(255,255,255,0.65)', marginTop: 2 },
  separator: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  body: { padding: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 5,
    elevation: 2,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  cardInfo: { flex: 1, marginRight: 10 },
  userName: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  projectId: { fontSize: 11, color: COLORS.textSecondary, marginBottom: 2 },
  date: { fontSize: 11, color: COLORS.textSecondary },
  right: { alignItems: 'flex-end', gap: 6 },
  amount: { fontSize: 15, fontWeight: '800', color: COLORS.primary },
  badge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  ref: { fontSize: 11, color: COLORS.textSecondary, marginTop: 8, fontStyle: 'italic' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary },
});
