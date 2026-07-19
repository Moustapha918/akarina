import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Project } from '../../types';
import { COLORS } from '../../constants';
import {
  formatMRU,
  collectProgress,
  projectStatusLabel,
  projectStatusColor,
} from '../../utils/format';

interface ProjectCardProps {
  project: Project;
}

export function ProjectCard({ project }: ProjectCardProps) {
  const { t } = useTranslation();
  const progress = collectProgress(project.collectedAmount, project.targetAmount);
  const statusColor = projectStatusColor(project.status);

  return (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.92}
      onPress={() => router.push(`/(app)/project/${project.id}`)}
    >
      {/* Image */}
      <View style={styles.imageContainer}>
        {project.coverImageUrl ? (
          <Image source={{ uri: project.coverImageUrl }} style={styles.image} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Text style={styles.imagePlaceholderText}>🏗️</Text>
          </View>
        )}
        {/* Badge statut */}
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{projectStatusLabel(project.status)}</Text>
        </View>
      </View>

      {/* Contenu */}
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>{project.title}</Text>
        <Text style={styles.location}>📍 {project.location}</Text>

        {/* Barre de progression */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress}%` }]} />
          </View>
          <Text style={styles.progressText}>{progress}%</Text>
        </View>

        {/* Stats */}
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{formatMRU(project.collectedAmount, true)}</Text>
            <Text style={styles.statLabel}>{t('project.collected')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{project.roiEstimate}%</Text>
            <Text style={styles.statLabel}>{t('project.roiEstimate')}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{project.roiDurationMonths} {t('project.duration')}</Text>
            <Text style={styles.statLabel}>{t('project.durationShort')}</Text>
          </View>
        </View>

        {/* Montant minimum */}
        <View style={styles.footer}>
          <Text style={styles.minInvest}>
            {t('project.fromAmount')}{' '}
            <Text style={styles.minInvestAmount}>{formatMRU(project.minInvestment)}</Text>
          </Text>
          <Text style={styles.investors}>
            👥 {project.currentInvestors}/{project.maxInvestors}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
    height: 180,
  },
  image: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#D6EAF8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    fontSize: 48,
  },
  statusBadge: {
    position: 'absolute',
    top: 12,
    start: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  body: {
    padding: 16,
    gap: 10,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 22,
  },
  location: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#E8E8E8',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primary,
    minWidth: 32,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 10,
    padding: 12,
  },
  stat: {
    flex: 1,
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: COLORS.border,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  minInvest: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  minInvestAmount: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  investors: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
