import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../../src/constants';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { useMyInvestments, InvestmentWithProject } from '../../../src/hooks/useMyInvestments';
import { formatMRU, collectProgress, projectStatusLabel, projectStatusColor } from '../../../src/utils/format';
import { Investment, KycStatus } from '../../../src/types';

// ─── KYC Badge ───────────────────────────────────────────────────────────────

const KYC_LABELS: Record<KycStatus, string> = {
  NONE: 'KYC non soumis',
  PENDING: 'KYC en cours',
  VERIFIED: 'KYC vérifié',
  REJECTED: 'KYC rejeté',
};
const KYC_COLORS: Record<KycStatus, string> = {
  NONE: COLORS.textSecondary,
  PENDING: COLORS.warning,
  VERIFIED: COLORS.success,
  REJECTED: COLORS.danger,
};
const KYC_ICONS: Record<KycStatus, string> = {
  NONE: '○',
  PENDING: '⏳',
  VERIFIED: '✓',
  REJECTED: '✗',
};

// ─── Investment status ────────────────────────────────────────────────────────

const STATUS_LABEL: Record<Investment['status'], string> = {
  PENDING: 'En attente',
  SUCCESS: 'Confirmé',
  FAILED: 'Échoué',
};
const STATUS_COLOR: Record<Investment['status'], string> = {
  PENDING: COLORS.warning,
  SUCCESS: COLORS.success,
  FAILED: COLORS.danger,
};

// ─── Investment Card ──────────────────────────────────────────────────────────

function InvestmentCard({ item }: { item: InvestmentWithProject }) {
  const { investment, project } = item;

  const estimatedGain = project
    ? Math.round(investment.amount * (project.roiEstimate / 100))
    : null;

  const progress = project
    ? collectProgress(project.collectedAmount, project.targetAmount)
    : 0;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => project && router.push(`/(app)/project/${project.id}`)}
      activeOpacity={0.85}
    >
      {/* Image + header */}
      <View style={styles.cardHeader}>
        {project?.coverImageUrl ? (
          <Image source={{ uri: project.coverImageUrl }} style={styles.cardImage} />
        ) : (
          <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
            <Text style={styles.cardImagePlaceholderText}>🏗</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={2}>
            {project?.title ?? 'Projet inconnu'}
          </Text>
          {project?.location ? (
            <Text style={styles.cardLocation}>📍 {project.location}</Text>
          ) : null}
          <View style={styles.badgeRow}>
            {/* Statut paiement */}
            <View style={[styles.badge, { backgroundColor: STATUS_COLOR[investment.status] + '20' }]}>
              <Text style={[styles.badgeText, { color: STATUS_COLOR[investment.status] }]}>
                {STATUS_LABEL[investment.status]}
              </Text>
            </View>
            {/* Statut projet */}
            {project && (
              <View style={[styles.badge, { backgroundColor: projectStatusColor(project.status) + '20', marginLeft: 6 }]}>
                <Text style={[styles.badgeText, { color: projectStatusColor(project.status) }]}>
                  {projectStatusLabel(project.status)}
                </Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Montants */}
      <View style={styles.cardAmounts}>
        <View>
          <Text style={styles.amountLabel}>Investi</Text>
          <Text style={styles.amountValue}>{formatMRU(investment.amount)}</Text>
        </View>
        {estimatedGain !== null && (
          <View style={styles.roiBox}>
            <Text style={styles.amountLabel}>Gain estimé</Text>
            <Text style={styles.roiValue}>+{formatMRU(estimatedGain)}</Text>
          </View>
        )}
        {project && (
          <View>
            <Text style={styles.amountLabel}>ROI</Text>
            <Text style={styles.roiRate}>{project.roiEstimate}%</Text>
          </View>
        )}
      </View>

      {/* Barre de progression projet */}
      {project && (
        <View style={styles.progressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressLabel}>
            {progress}% collecté · {formatMRU(project.collectedAmount, true)} / {formatMRU(project.targetAmount, true)}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Stats Summary ────────────────────────────────────────────────────────────

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.statCard}>
      <Text style={styles.statValue}>{value}</Text>
      {sub ? <Text style={styles.statSub}>{sub}</Text> : null}
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function DashboardContent() {
  const { user } = useAuthStore();
  const { items, isLoading, error, refresh } = useMyInvestments(user?.id ?? null);

  // Ne compte que les investissements SUCCESS
  const confirmed = items.filter((i) => i.investment.status === 'SUCCESS');
  const totalInvested = confirmed.reduce((sum, i) => sum + i.investment.amount, 0);
  const totalGain = confirmed.reduce((sum, i) => {
    const roi = i.project?.roiEstimate ?? 0;
    return sum + Math.round(i.investment.amount * roi / 100);
  }, 0);
  const activeProjects = new Set(confirmed.map((i) => i.investment.projectId)).size;

  const kycStatus = user?.kycStatus ?? 'NONE';

  return (
    <ScrollView
      style={styles.flex}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} tintColor={COLORS.primary} />}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Bonjour, {user?.name?.split(' ')[0]} 👋</Text>
          <Text style={styles.subGreeting}>Voici l'état de votre portefeuille</Text>
        </View>
        <TouchableOpacity
          style={[styles.kycBadge, { borderColor: KYC_COLORS[kycStatus] }]}
          onPress={() => router.push('/(app)/kyc')}
        >
          <Text style={[styles.kycIcon, { color: KYC_COLORS[kycStatus] }]}>
            {KYC_ICONS[kycStatus]}
          </Text>
          <Text style={[styles.kycLabel, { color: KYC_COLORS[kycStatus] }]}>
            {KYC_LABELS[kycStatus]}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={styles.statsRow}>
        <StatCard
          label="Total investi"
          value={totalInvested > 0 ? formatMRU(totalInvested, true) : '—'}
        />
        <StatCard
          label="Projets"
          value={String(activeProjects)}
        />
        <StatCard
          label="Gain estimé"
          value={totalGain > 0 ? '+' + formatMRU(totalGain, true) : '—'}
          sub={totalInvested > 0 ? `${Math.round(totalGain / totalInvested * 100)}%` : undefined}
        />
      </View>

      {/* Liste */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Mes investissements</Text>

        {isLoading && items.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : error ? (
          <Text style={styles.errorText}>{error}</Text>
        ) : items.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📈</Text>
            <Text style={styles.emptyTitle}>Aucun investissement</Text>
            <Text style={styles.emptyText}>
              Découvrez nos projets immobiliers et réalisez votre premier investissement.
            </Text>
            <TouchableOpacity
              style={styles.emptyButton}
              onPress={() => router.push('/(app)')}
            >
              <Text style={styles.emptyButtonText}>Voir les projets</Text>
            </TouchableOpacity>
          </View>
        ) : (
          items.map((item) => (
            <InvestmentCard key={item.investment.id} item={item} />
          ))
        )}
      </View>
    </ScrollView>
  );
}

export default function DashboardScreen() {
  return (
    <GuestGuard
      icon="📊"
      title="Votre portfolio"
      description="Connectez-vous pour suivre vos investissements et l'évolution de vos projets."
    >
      <DashboardContent />
    </GuestGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 32 },

  // Header
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
  },
  subGreeting: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 4,
  },
  kycBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: 'rgba(255,255,255,0.1)',
    gap: 4,
  },
  kycIcon: { fontSize: 12, fontWeight: '700' },
  kycLabel: { fontSize: 11, fontWeight: '600' },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    paddingHorizontal: 16,
    marginTop: -16,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
    textAlign: 'center',
  },
  statSub: {
    fontSize: 11,
    color: COLORS.success,
    fontWeight: '600',
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: 'center',
  },

  // Section
  section: { paddingHorizontal: 16 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },

  // Card
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  cardImage: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  cardImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#EBF5FB',
  },
  cardImagePlaceholderText: { fontSize: 28 },
  cardInfo: { flex: 1 },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 4,
    lineHeight: 20,
  },
  cardLocation: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: 8,
  },
  badgeRow: { flexDirection: 'row', flexWrap: 'wrap' },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  badgeText: { fontSize: 11, fontWeight: '600' },

  // Amounts
  cardAmounts: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginBottom: 10,
  },
  amountLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  roiBox: { alignItems: 'center' },
  roiValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.success,
  },
  roiRate: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.secondary,
  },

  // Progress
  progressSection: { gap: 4 },
  progressBar: {
    height: 5,
    backgroundColor: COLORS.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primaryLight,
    borderRadius: 4,
  },
  progressLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },

  // Empty
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 28,
    paddingVertical: 13,
  },
  emptyButtonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },

  // Error
  errorText: {
    color: COLORS.danger,
    textAlign: 'center',
    marginTop: 32,
    fontSize: 14,
  },
});
