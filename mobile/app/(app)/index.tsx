import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { COLORS } from '../../src/constants';
import { ProjectStatus } from '../../src/types';
import { useProjects } from '../../src/hooks/useProjects';
import { ProjectCard } from '../../src/components/project/ProjectCard';
import { useAuthStore } from '../../src/hooks/useAuthStore';

const FILTERS: { label: string; value?: ProjectStatus }[] = [
  { label: 'Tous' },
  { label: 'Ouverts', value: 'OPEN' },
  { label: 'En construction', value: 'CONSTRUCTION' },
  { label: 'Terminés', value: 'COMPLETED' },
];

export default function ProjectsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<ProjectStatus | undefined>(undefined);
  const { projects, isLoading, error, refetch } = useProjects(activeFilter);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>أكارينا — Akarina</Text>
          <Text style={styles.headerSub}>Projets immobiliers</Text>
        </View>
        {user ? (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={() => router.push('/(app)/profile')}
          >
            <Text style={styles.avatarText}>
              {user.name.charAt(0).toUpperCase()}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.loginButtonText}>Se connecter</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filtres */}
      <View style={styles.filtersContainer}>
        <FlatList
          horizontal
          data={FILTERS}
          keyExtractor={(f) => f.label}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.filterChip,
                activeFilter === item.value && styles.filterChipActive,
              ]}
              onPress={() => setActiveFilter(item.value)}
            >
              <Text
                style={[
                  styles.filterText,
                  activeFilter === item.value && styles.filterTextActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Contenu */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : error ? (
        <View style={styles.center}>
          <Text style={styles.errorEmoji}>⚠️</Text>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={refetch} style={styles.retryButton}>
            <Text style={styles.retryText}>Réessayer</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={projects}
          keyExtractor={(p) => p.id}
          renderItem={({ item }) => <ProjectCard project={item} />}
          contentContainerStyle={[
            styles.list,
            projects.length === 0 && styles.listEmpty,
          ]}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refetch}
              tintColor={COLORS.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>🏗️</Text>
              <Text style={styles.emptyTitle}>Aucun projet disponible</Text>
              <Text style={styles.emptyText}>
                De nouveaux projets seront bientôt disponibles. Revenez prochainement.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.primary,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.secondary,
  },
  headerSub: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 2,
  },
  avatarButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primary,
  },
  loginButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  filtersContainer: {
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  filters: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  filterTextActive: {
    color: '#fff',
  },
  list: {
    padding: 16,
  },
  listEmpty: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    padding: 24,
  },
  errorEmoji: { fontSize: 40 },
  errorText: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: COLORS.primary,
    borderRadius: 20,
  },
  retryText: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyEmoji: { fontSize: 56 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
