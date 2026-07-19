import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { signOut } from '../../../src/services/authService';
import { COLORS } from '../../../src/constants';
import { KycStatus } from '../../../src/types';

const KYC_LABEL: Record<KycStatus, string> = {
  NONE: 'Non soumis',
  PENDING: 'En attente',
  VERIFIED: 'Vérifié',
  REJECTED: 'Rejeté',
};
const KYC_COLOR: Record<KycStatus, string> = {
  NONE: COLORS.textSecondary,
  PENDING: COLORS.warning,
  VERIFIED: COLORS.success,
  REJECTED: COLORS.danger,
};

function Row({ icon, label, value, onPress, danger }: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={onPress ? 0.7 : 1}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowBody}>
        <Text style={[styles.rowLabel, danger && styles.rowLabelDanger]}>{label}</Text>
        {value ? <Text style={styles.rowValue}>{value}</Text> : null}
      </View>
      {onPress && <Text style={styles.rowChevron}>›</Text>}
    </TouchableOpacity>
  );
}

function ProfileContent() {
  const insets = useSafeAreaInsets();
  const { user, signOut: clearStore } = useAuthStore();

  async function handleSignOut() {
    Alert.alert(
      'Déconnexion',
      'Voulez-vous vraiment vous déconnecter ?',
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Déconnexion',
          style: 'destructive',
          onPress: async () => {
            await signOut();
            clearStore();
            router.replace('/(auth)/login');
          },
        },
      ]
    );
  }

  const kycStatus = user?.kycStatus ?? 'NONE';

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase() ?? '?'}
          </Text>
        </View>
        <Text style={styles.name}>{user?.name}</Text>
        <Text style={styles.phone}>{user?.phone}</Text>
      </View>

      {/* Infos */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Informations</Text>
        <View style={styles.card}>
          <Row icon="👤" label="Nom complet" value={user?.name} />
          <View style={styles.separator} />
          <Row icon="📧" label="Email" value={user?.email || '—'} />
          <View style={styles.separator} />
          <Row icon="📱" label="Téléphone" value={user?.phone} />
        </View>
      </View>

      {/* KYC */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Vérification</Text>
        <View style={styles.card}>
          <Row
            icon="🪪"
            label="Statut KYC"
            value={KYC_LABEL[kycStatus]}
            onPress={() => router.push('/(app)/kyc')}
          />
        </View>
        <View style={[styles.kycBadge, { borderColor: KYC_COLOR[kycStatus] + '40', backgroundColor: KYC_COLOR[kycStatus] + '10' }]}>
          <Text style={[styles.kycBadgeText, { color: KYC_COLOR[kycStatus] }]}>
            {kycStatus === 'VERIFIED'
              ? '✓ Investissement illimité débloqué'
              : kycStatus === 'PENDING'
              ? '⏳ En cours de vérification par notre équipe'
              : kycStatus === 'REJECTED'
              ? '✗ Documents rejetés — soumettez à nouveau'
              : '○ Requis pour investir au-delà de 5 000 MRU'}
          </Text>
        </View>
      </View>

      {/* Compte */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Compte</Text>
        <View style={styles.card}>
          <Row
            icon="🚪"
            label="Déconnexion"
            onPress={handleSignOut}
            danger
          />
        </View>
      </View>

      <Text style={styles.version}>Akarina v1.0.0</Text>
    </ScrollView>
  );
}

export default function ProfileScreen() {
  return (
    <GuestGuard
      icon="👤"
      title="Votre profil"
      description="Connectez-vous pour accéder à votre profil et gérer vos informations."
    >
      <ProfileContent />
    </GuestGuard>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 40 },

  header: {
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    paddingBottom: 28,
    paddingHorizontal: 24,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#fff' },
  name: { fontSize: 20, fontWeight: '700', color: '#fff', marginBottom: 4 },
  phone: { fontSize: 14, color: 'rgba(255,255,255,0.7)' },

  section: { paddingHorizontal: 16, marginTop: 24 },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 8,
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  separator: { height: 1, backgroundColor: COLORS.border, marginLeft: 52 },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
  },
  rowIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  rowBody: { flex: 1 },
  rowLabel: { fontSize: 15, color: COLORS.textPrimary, fontWeight: '500' },
  rowLabelDanger: { color: COLORS.danger },
  rowValue: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  rowChevron: { fontSize: 20, color: COLORS.border },

  kycBadge: {
    marginTop: 8,
    borderRadius: 10,
    borderWidth: 1,
    padding: 12,
  },
  kycBadgeText: { fontSize: 13, fontWeight: '500' },

  version: {
    textAlign: 'center',
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 32,
  },
});
