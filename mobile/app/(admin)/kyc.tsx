import { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, RefreshControl,
  Image, TouchableOpacity, Alert, ActivityIndicator, TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getPendingKycSubmissions, approveKyc, rejectKyc, KycSubmission } from '../../src/services/adminService';
import { COLORS } from '../../src/constants';

function KycCard({ submission, onAction }: { submission: KycSubmission; onAction: () => void }) {
  const { user, documents } = submission;
  const front = documents.find((d) => (d as any).side === 'FRONT');
  const back = documents.find((d) => (d as any).side === 'BACK');
  const [loading, setLoading] = useState(false);

  async function handleApprove() {
    Alert.alert(
      'Approuver le KYC',
      `Confirmer la vérification de ${user.name} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Approuver',
          onPress: async () => {
            setLoading(true);
            try {
              await approveKyc(user.id);
              onAction();
            } catch (e: any) {
              Alert.alert('Erreur', e.message);
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  }

  async function handleReject() {
    Alert.prompt(
      'Motif de rejet',
      `Document(s) refusé(s) pour ${user.name}. Précisez le motif :`,
      async (reason) => {
        if (!reason?.trim()) return;
        setLoading(true);
        try {
          await rejectKyc(user.id, reason.trim());
          onAction();
        } catch (e: any) {
          Alert.alert('Erreur', e.message);
        } finally {
          setLoading(false);
        }
      },
      'plain-text',
      '',
      'default'
    );
  }

  return (
    <View style={styles.card}>
      {/* User info */}
      <View style={styles.cardHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.name?.charAt(0).toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userPhone}>{user.phone}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
      </View>

      {/* Documents */}
      <View style={styles.docsRow}>
        {front && (
          <View style={styles.docBox}>
            <Text style={styles.docLabel}>Recto</Text>
            <Image source={{ uri: front.downloadUrl }} style={styles.docImage} resizeMode="cover" />
          </View>
        )}
        {back && (
          <View style={styles.docBox}>
            <Text style={styles.docLabel}>Verso</Text>
            <Image source={{ uri: back.downloadUrl }} style={styles.docImage} resizeMode="cover" />
          </View>
        )}
        {!front && !back && (
          <Text style={styles.noDocs}>Aucun document soumis</Text>
        )}
      </View>

      {/* Actions */}
      {loading ? (
        <ActivityIndicator color={COLORS.primary} style={{ marginTop: 12 }} />
      ) : (
        <View style={styles.actions}>
          <TouchableOpacity style={[styles.btn, styles.btnReject]} onPress={handleReject}>
            <Text style={styles.btnRejectText}>✗ Rejeter</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.btn, styles.btnApprove]} onPress={handleApprove}>
            <Text style={styles.btnApproveText}>✓ Approuver</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

export default function AdminKyc() {
  const insets = useSafeAreaInsets();
  const [submissions, setSubmissions] = useState<KycSubmission[]>([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    try {
      setSubmissions(await getPendingKycSubmissions());
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
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <Text style={styles.title}>Vérifications KYC</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{submissions.length} en attente</Text>
        </View>
      </View>

      <View style={styles.body}>
        {loading && submissions.length === 0 ? (
          <ActivityIndicator color={COLORS.primary} style={{ marginTop: 40 }} />
        ) : submissions.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyTitle}>Aucun KYC en attente</Text>
            <Text style={styles.emptyText}>Toutes les demandes ont été traitées.</Text>
          </View>
        ) : (
          submissions.map((s) => (
            <KycCard key={s.user.id} submission={s} onAction={load} />
          ))
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { fontSize: 22, fontWeight: '700', color: '#fff' },
  badge: {
    backgroundColor: COLORS.warning,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  body: { padding: 16 },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 3,
  },
  cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 16 },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 18 },
  userInfo: { flex: 1 },
  userName: { fontSize: 15, fontWeight: '700', color: COLORS.textPrimary },
  userPhone: { fontSize: 13, color: COLORS.textSecondary },
  userEmail: { fontSize: 12, color: COLORS.textSecondary },

  docsRow: { flexDirection: 'row', gap: 10, marginBottom: 14 },
  docBox: { flex: 1 },
  docLabel: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 4 },
  docImage: {
    width: '100%',
    height: 110,
    borderRadius: 10,
    backgroundColor: COLORS.border,
  },
  noDocs: { fontSize: 13, color: COLORS.textSecondary, fontStyle: 'italic' },

  actions: { flexDirection: 'row', gap: 10 },
  btn: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  btnReject: { backgroundColor: '#FADBD8', borderWidth: 1, borderColor: COLORS.danger + '40' },
  btnApprove: { backgroundColor: '#D5F5E3', borderWidth: 1, borderColor: COLORS.success + '40' },
  btnRejectText: { color: COLORS.danger, fontWeight: '700', fontSize: 14 },
  btnApproveText: { color: COLORS.success, fontWeight: '700', fontSize: 14 },

  empty: { alignItems: 'center', paddingVertical: 60 },
  emptyIcon: { fontSize: 48, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary },
});
