import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../src/constants';
import { Project, ProjectUpdate } from '../../../src/types';
import { getProject, getProjectUpdates } from '../../../src/services/projectService';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { AuthPromptModal } from '../../../src/components/ui/AuthPromptModal';
import { Button } from '../../../src/components/ui/Button';
import {
  formatMRU,
  collectProgress,
  projectStatusLabel,
  projectStatusColor,
  projectTypeLabel,
  projectTypeIcon,
} from '../../../src/utils/format';

const { width } = Dimensions.get('window');

export default function ProjectDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { t } = useTranslation();

  const [project, setProject] = useState<Project | null>(null);
  const [updates, setUpdates] = useState<ProjectUpdate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthModal, setShowAuthModal] = useState(false);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), getProjectUpdates(id)]).then(([p, u]) => {
      setProject(p);
      setUpdates(u);
      setIsLoading(false);
    });
  }, [id]);

  function handleInvest() {
    if (!user) {
      setShowAuthModal(true);
      return;
    }
    router.push(`/(app)/invest/${id}/amount`);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorEmoji}>⚠️</Text>
        <Text style={styles.errorText}>{t('project.notFound')}</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>{t('project.back')}</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const progress = collectProgress(project.collectedAmount, project.targetAmount);
  const statusColor = projectStatusColor(project.status);
  const isOpen = project.status === 'OPEN';
  const isRental = project.projectType === 'CONSTRUCTION' && project.exitStrategy === 'RENTAL';
  const isLandFlip = project.projectType === 'LAND_FLIP';

  const mousharakaText = isRental
    ? t('project.mousharakaRental')
    : isLandFlip
    ? t('project.mousharakaLandFlip')
    : t('project.mousharakaConstruction');

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Image hero */}
        <View style={styles.heroContainer}>
          {project.coverImageUrl ? (
            <Image source={{ uri: project.coverImageUrl }} style={styles.heroImage} />
          ) : (
            <View style={styles.heroPlaceholder}>
              <Text style={styles.heroEmoji}>🏗️</Text>
            </View>
          )}

          {/* Bouton retour */}
          <TouchableOpacity
            style={[styles.backButton, { top: insets.top + 12 }]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>

          {/* Badge statut */}
          <View style={[styles.heroBadge, { backgroundColor: statusColor }]}>
            <Text style={styles.heroBadgeText}>{projectStatusLabel(project.status)}</Text>
          </View>
        </View>

        <View style={styles.content}>
          {/* Titre & localisation */}
          <Text style={styles.title}>{project.title}</Text>
          <Text style={styles.location}>📍 {project.location}</Text>

          {/* Badges type & stratégie */}
          <View style={styles.typeBadgeRow}>
            <View style={styles.typeBadge}>
              <Text style={styles.typeBadgeText}>
                {projectTypeIcon(project.projectType ?? 'CONSTRUCTION')} {projectTypeLabel(project.projectType ?? 'CONSTRUCTION')}
              </Text>
            </View>
            {project.exitStrategy && (
              <View style={[styles.typeBadge, styles.typeBadgeAlt]}>
                <Text style={styles.typeBadgeText}>
                  {project.exitStrategy === 'RENTAL' ? t('project.exitRental') : t('project.exitSale')}
                </Text>
              </View>
            )}
          </View>

          {/* Progression */}
          <View style={styles.progressSection}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressAmount}>
                {formatMRU(project.collectedAmount, true)}
              </Text>
              <Text style={styles.progressTarget}>
                {t('project.on')} {formatMRU(project.targetAmount, true)}
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressPercent}>{progress}{t('project.fundedPercent')}</Text>
          </View>

          {/* Stats clés */}
          <View style={styles.statsGrid}>
            {isRental && project.monthlyRent ? (
              <StatCard
                label={t('project.monthlyRent')}
                value={formatMRU(project.monthlyRent, true)}
                icon="🏠"
              />
            ) : (
              <StatCard label={t('project.roiEstimate')} value={`${project.roiEstimate}%`} icon="📈" />
            )}
            <StatCard label={t('project.durationLabel')} value={`${project.roiDurationMonths} ${t('project.duration')}`} icon="📅" />
            <StatCard label={t('project.minInvestment')} value={formatMRU(project.minInvestment, true)} icon="💰" />
            <StatCard
              label={t('project.investors')}
              value={`${project.currentInvestors}/${project.maxInvestors}`}
              icon="👥"
            />
          </View>

          {/* Description */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{t('project.about')}</Text>
            <Text style={styles.description}>{project.description}</Text>
          </View>

          {/* Contrat Mousharaka */}
          <View style={styles.mousharakaBox}>
            <Text style={styles.mousharakaTitle}>{t('project.mousharakaTitle')}</Text>
            <Text style={styles.mousharakaText}>{mousharakaText}</Text>
            <View style={styles.mousharakaBadge}>
              <Text style={styles.mousharakaBadgeText}>{t('project.shariaCompliant')}</Text>
            </View>
          </View>

          {/* Actualités chantier */}
          {updates.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{t('project.updates')}</Text>
              {updates.map((update) => (
                <UpdateCard key={update.id} update={update} />
              ))}
            </View>
          )}

          {/* Espace pour le bouton sticky */}
          <View style={{ height: 100 }} />
        </View>
      </ScrollView>

      {/* Bouton Investir sticky */}
      <View style={[styles.stickyFooter, { paddingBottom: insets.bottom + 16 }]}>
        {isOpen ? (
          <Button
            label={user ? t('project.investBtn') : t('project.investSignIn')}
            onPress={handleInvest}
            style={styles.investButton}
          />
        ) : (
          <View style={styles.closedBanner}>
            <Text style={styles.closedBannerText}>{t('project.closedBanner')}</Text>
          </View>
        )}
      </View>

      <AuthPromptModal
        visible={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        message={t('project.authPrompt', { title: project.title })}
      />
    </View>
  );
}

function StatCard({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.icon}>{icon}</Text>
      <Text style={statStyles.value}>{value}</Text>
      <Text style={statStyles.label}>{label}</Text>
    </View>
  );
}

function UpdateCard({ update }: { update: ProjectUpdate }) {
  return (
    <View style={updateStyles.card}>
      {update.imageUrls?.[0] ? (
        <Image source={{ uri: update.imageUrls[0] }} style={updateStyles.image} />
      ) : null}
      <View style={updateStyles.body}>
        <Text style={updateStyles.title}>{update.title}</Text>
        <Text style={updateStyles.description} numberOfLines={3}>{update.description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorEmoji: { fontSize: 40 },
  errorText: { fontSize: 15, color: COLORS.textSecondary },
  backLink: { color: COLORS.primary, fontWeight: '600', fontSize: 15 },
  heroContainer: {
    height: 260,
    position: 'relative',
  },
  heroImage: { width: '100%', height: '100%', resizeMode: 'cover' },
  heroPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D6EAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroEmoji: { fontSize: 64 },
  backButton: {
    position: 'absolute',
    start: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: { color: '#fff', fontSize: 20, fontWeight: '700' },
  heroBadge: {
    position: 'absolute',
    bottom: 16,
    start: 16,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
  },
  heroBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  content: { padding: 20, gap: 20 },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    lineHeight: 30,
  },
  location: { fontSize: 14, color: COLORS.textSecondary, marginTop: -12 },
  typeBadgeRow: { flexDirection: 'row', gap: 8, marginTop: -8 },
  typeBadge: {
    backgroundColor: '#EBF5FB',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#AED6F1',
  },
  typeBadgeAlt: { backgroundColor: '#FEF9E7', borderColor: '#F9E79F' },
  typeBadgeText: { fontSize: 12, fontWeight: '600', color: COLORS.primary },
  progressSection: { gap: 6 },
  progressHeader: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  progressAmount: { fontSize: 22, fontWeight: '800', color: COLORS.primary },
  progressTarget: { fontSize: 14, color: COLORS.textSecondary },
  progressBar: {
    height: 8,
    backgroundColor: '#E8E8E8',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressPercent: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '600' },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  section: { gap: 12 },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  description: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 24,
  },
  mousharakaBox: {
    backgroundColor: '#EBF5FB',
    borderRadius: 14,
    padding: 18,
    gap: 10,
    borderStartWidth: 4,
    borderStartColor: COLORS.primary,
  },
  mousharakaTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  mousharakaText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  mousharakaBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#D5F5E3',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  mousharakaBadgeText: {
    color: COLORS.success,
    fontSize: 13,
    fontWeight: '700',
  },
  stickyFooter: {
    position: 'absolute',
    bottom: 0,
    start: 0,
    end: 0,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  investButton: {},
  closedBanner: {
    backgroundColor: '#F2F3F4',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  closedBannerText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
  },
});

const statStyles = StyleSheet.create({
  card: {
    width: (width - 50) / 2,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  icon: { fontSize: 22 },
  value: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  label: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center' },
});

const updateStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  image: { width: '100%', height: 160, resizeMode: 'cover' },
  body: { padding: 14, gap: 6 },
  title: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  description: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
});
