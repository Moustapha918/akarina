import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  TouchableOpacity, Alert, Modal, TextInput, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  getAllProjects, createProject, updateProjectStatus, addProjectUpdate,
  CreateProjectDTO,
} from '../../src/services/adminService';
import { Project, ProjectStatus } from '../../src/types';
import { formatMRU, collectProgress, projectStatusLabel, projectStatusColor } from '../../src/utils/format';
import { COLORS } from '../../src/constants';

const STATUS_FLOW: ProjectStatus[] = ['OPEN', 'FUNDED', 'CONSTRUCTION', 'COMPLETED'];

// ─── Formulaire création ───────────────────────────────────────────────────────

function CreateProjectModal({ visible, onClose, onCreated }: {
  visible: boolean; onClose: () => void; onCreated: () => void;
}) {
  const [form, setForm] = useState<Partial<CreateProjectDTO>>({});
  const [loading, setLoading] = useState(false);

  function field(key: keyof CreateProjectDTO) {
    return (val: string) => setForm((f) => ({ ...f, [key]: val }));
  }
  function numField(key: keyof CreateProjectDTO) {
    return (val: string) => setForm((f) => ({ ...f, [key]: parseFloat(val) || 0 }));
  }

  async function handleCreate() {
    if (!form.title || !form.description || !form.location || !form.targetAmount) {
      Alert.alert('Champs requis', 'Titre, description, localisation et montant cible sont obligatoires.');
      return;
    }
    setLoading(true);
    try {
      await createProject({
        title: form.title!,
        description: form.description!,
        location: form.location!,
        targetAmount: form.targetAmount!,
        roiEstimate: form.roiEstimate ?? 15,
        roiDurationMonths: form.roiDurationMonths ?? 24,
        minInvestment: form.minInvestment ?? 1000,
        maxInvestors: form.maxInvestors ?? 200,
        coverImageUrl: form.coverImageUrl ?? '',
      });
      onCreated();
      onClose();
      setForm({});
    } catch (e: any) {
      Alert.alert('Erreur', e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView style={modal.flex} contentContainerStyle={modal.container}>
          <View style={modal.header}>
            <Text style={modal.title}>Nouveau projet</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={modal.close}>✕</Text>
            </TouchableOpacity>
          </View>

          {[
            { label: 'Titre *', key: 'title', placeholder: 'Résidence Al-Wadi' },
            { label: 'Localisation *', key: 'location', placeholder: 'Tevragh-Zeina, Nouakchott' },
            { label: 'URL image de couverture', key: 'coverImageUrl', placeholder: 'https://...' },
          ].map(({ label, key, placeholder }) => (
            <View key={key} style={modal.fieldGroup}>
              <Text style={modal.label}>{label}</Text>
              <TextInput
                style={modal.input}
                placeholder={placeholder}
                placeholderTextColor={COLORS.disabled}
                value={(form as any)[key] ?? ''}
                onChangeText={field(key as keyof CreateProjectDTO)}
              />
            </View>
          ))}

          <View style={modal.fieldGroup}>
            <Text style={modal.label}>Description *</Text>
            <TextInput
              style={[modal.input, modal.textarea]}
              placeholder="Description du projet..."
              placeholderTextColor={COLORS.disabled}
              value={form.description ?? ''}
              onChangeText={field('description')}
              multiline
              numberOfLines={4}
            />
          </View>

          <View style={modal.row}>
            {[
              { label: 'Montant cible (MRU) *', key: 'targetAmount', placeholder: '5000000' },
              { label: 'ROI estimé (%)', key: 'roiEstimate', placeholder: '15' },
            ].map(({ label, key, placeholder }) => (
              <View key={key} style={[modal.fieldGroup, { flex: 1 }]}>
                <Text style={modal.label}>{label}</Text>
                <TextInput
                  style={modal.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.disabled}
                  value={(form as any)[key]?.toString() ?? ''}
                  onChangeText={numField(key as keyof CreateProjectDTO)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <View style={modal.row}>
            {[
              { label: 'Durée (mois)', key: 'roiDurationMonths', placeholder: '24' },
              { label: 'Invest. min. (MRU)', key: 'minInvestment', placeholder: '1000' },
              { label: 'Max investisseurs', key: 'maxInvestors', placeholder: '200' },
            ].map(({ label, key, placeholder }) => (
              <View key={key} style={[modal.fieldGroup, { flex: 1 }]}>
                <Text style={modal.label}>{label}</Text>
                <TextInput
                  style={modal.input}
                  placeholder={placeholder}
                  placeholderTextColor={COLORS.disabled}
                  value={(form as any)[key]?.toString() ?? ''}
                  onChangeText={numField(key as keyof CreateProjectDTO)}
                  keyboardType="numeric"
                />
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={[modal.createBtn, loading && { opacity: 0.6 }]}
            onPress={handleCreate}
            disabled={loading}
          >
            {loading
              ? <ActivityIndicator color="#fff" />
              : <Text style={modal.createBtnText}>Créer le projet</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project, onUpdate }: { project: Project; onUpdate: () => void }) {
  const progress = collectProgress(project.collectedAmount, project.targetAmount);
  const statusColor = projectStatusColor(project.status);
  const nextStatus = STATUS_FLOW[STATUS_FLOW.indexOf(project.status) + 1];

  function handleStatusChange() {
    if (!nextStatus) return;
    Alert.alert(
      'Changer le statut',
      `Passer "${project.title}" de "${projectStatusLabel(project.status)}" à "${projectStatusLabel(nextStatus)}" ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Confirmer',
          onPress: async () => {
            try {
              await updateProjectStatus(project.id, nextStatus);
              onUpdate();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            }
          },
        },
      ]
    );
  }

  function handleAddUpdate() {
    Alert.prompt(
      'Titre de l\'actualité',
      '',
      (title) => {
        if (!title?.trim()) return;
        Alert.prompt('Description', '', async (description) => {
          if (!description?.trim()) return;
          try {
            await addProjectUpdate(project.id, title.trim(), description.trim());
            Alert.alert('Succès', 'Actualité publiée.');
          } catch (e: any) {
            Alert.alert('Erreur', e.message);
          }
        });
      }
    );
  }

  return (
    <View style={styles.card}>
      <View style={styles.cardTop}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>{project.title}</Text>
          <Text style={styles.cardLocation}>📍 {project.location}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor + '20' }]}>
          <Text style={[styles.statusText, { color: statusColor }]}>
            {projectStatusLabel(project.status)}
          </Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress}%`, backgroundColor: statusColor }]} />
        </View>
        <Text style={styles.progressLabel}>{progress}%</Text>
      </View>

      <View style={styles.cardStats}>
        <Text style={styles.cardStat}>
          💰 {formatMRU(project.collectedAmount, true)} / {formatMRU(project.targetAmount, true)}
        </Text>
        <Text style={styles.cardStat}>👥 {project.currentInvestors} / {project.maxInvestors}</Text>
        <Text style={styles.cardStat}>📈 {project.roiEstimate}%</Text>
      </View>

      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.actionBtn} onPress={handleAddUpdate}>
          <Text style={styles.actionBtnText}>+ Actualité</Text>
        </TouchableOpacity>
        {nextStatus && (
          <TouchableOpacity
            style={[styles.actionBtn, styles.actionBtnPrimary]}
            onPress={handleStatusChange}
          >
            <Text style={styles.actionBtnPrimaryText}>
              → {projectStatusLabel(nextStatus)}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function AdminProjects() {
  const insets = useSafeAreaInsets();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  async function load() {
    setLoading(true);
    try {
      setProjects(await getAllProjects());
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  return (
    <>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={COLORS.secondary} />}
      >
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.title}>Projets</Text>
          <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
            <Text style={styles.addBtnText}>+ Nouveau</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          {loading && projects.length === 0 ? (
            <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
          ) : projects.length === 0 ? (
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🏗</Text>
              <Text style={styles.emptyTitle}>Aucun projet</Text>
              <TouchableOpacity style={styles.emptyBtn} onPress={() => setShowCreate(true)}>
                <Text style={styles.emptyBtnText}>Créer le premier projet</Text>
              </TouchableOpacity>
            </View>
          ) : (
            projects.map((p) => <ProjectCard key={p.id} project={p} onUpdate={load} />)
          )}
        </View>
      </ScrollView>

      <CreateProjectModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={load}
      />
    </>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 32 },
  header: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  addBtn: {
    backgroundColor: COLORS.secondary,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  addBtnText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  body: { padding: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  cardInfo: { flex: 1, marginRight: 8 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  cardLocation: { fontSize: 12, color: COLORS.textSecondary },
  statusBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
  statusText: { fontSize: 11, fontWeight: '700' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 },
  progressBar: { flex: 1, height: 5, backgroundColor: COLORS.border, borderRadius: 4, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 4 },
  progressLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, width: 32 },
  cardStats: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  cardStat: { fontSize: 12, color: COLORS.textSecondary },
  cardActions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 9,
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: COLORS.textPrimary },
  actionBtnPrimary: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  actionBtnPrimaryText: { fontSize: 12, fontWeight: '700', color: '#fff' },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});

const modal = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { padding: 20, paddingBottom: 40 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary },
  close: { fontSize: 20, color: COLORS.textSecondary, padding: 4 },
  fieldGroup: { marginBottom: 14 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, marginBottom: 6 },
  input: {
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 14,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.surface,
  },
  textarea: { height: 90, textAlignVertical: 'top', paddingTop: 11 },
  createBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 8,
  },
  createBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});
