import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { Button } from '../../../src/components/ui/Button';
import { useAuthStore } from '../../../src/hooks/useAuthStore';
import { submitKycDocuments } from '../../../src/services/kycService';
import { COLORS } from '../../../src/constants';
import { KycStatus } from '../../../src/types';

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function pickImage(): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission refusée', 'Akarina a besoin d\'accéder à vos photos.');
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

async function takePhoto(): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert('Permission refusée', 'Akarina a besoin d\'accéder à la caméra.');
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: true,
    aspect: [4, 3],
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

// ─── Image Picker Card ────────────────────────────────────────────────────────

function ImagePickerCard({
  label,
  hint,
  uri,
  onPick,
}: {
  label: string;
  hint: string;
  uri: string | null;
  onPick: (uri: string) => void;
}) {
  function handlePress() {
    Alert.alert('Ajouter une photo', '', [
      {
        text: 'Prendre une photo',
        onPress: async () => {
          const u = await takePhoto();
          if (u) onPick(u);
        },
      },
      {
        text: 'Choisir dans la galerie',
        onPress: async () => {
          const u = await pickImage();
          if (u) onPick(u);
        },
      },
      { text: 'Annuler', style: 'cancel' },
    ]);
  }

  return (
    <TouchableOpacity style={styles.imageCard} onPress={handlePress} activeOpacity={0.8}>
      {uri ? (
        <>
          <Image source={{ uri }} style={styles.previewImage} resizeMode="cover" />
          <View style={styles.imageEditBadge}>
            <Text style={styles.imageEditText}>✏ Modifier</Text>
          </View>
        </>
      ) : (
        <View style={styles.imagePlaceholder}>
          <Text style={styles.imagePlaceholderIcon}>📷</Text>
          <Text style={styles.imagePlaceholderLabel}>{label}</Text>
          <Text style={styles.imagePlaceholderHint}>{hint}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

// ─── Status Views ─────────────────────────────────────────────────────────────

function PendingView() {
  return (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIconBg, { backgroundColor: '#FFF3CD' }]}>
        <Text style={styles.statusIcon}>⏳</Text>
      </View>
      <Text style={styles.statusTitle}>Documents soumis</Text>
      <Text style={styles.statusText}>
        Votre pièce d'identité est en cours de vérification par notre équipe.
        Ce processus prend généralement 24 à 48 heures ouvrées.
      </Text>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Que se passe-t-il maintenant ?</Text>
        {[
          'Notre équipe examine vos documents',
          'Vous recevrez une notification du résultat',
          "En cas de rejet, vous pourrez soumettre à nouveau",
        ].map((step, i) => (
          <View key={i} style={styles.infoRow}>
            <View style={styles.infoStep}>
              <Text style={styles.infoStepText}>{i + 1}</Text>
            </View>
            <Text style={styles.infoText}>{step}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

function VerifiedView() {
  return (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIconBg, { backgroundColor: '#D5F5E3' }]}>
        <Text style={styles.statusIcon}>✅</Text>
      </View>
      <Text style={styles.statusTitle}>Identité vérifiée</Text>
      <Text style={styles.statusText}>
        Votre identité a été confirmée. Vous pouvez investir sans limite de montant.
      </Text>
      <View style={[styles.infoBox, { borderColor: COLORS.success + '40', backgroundColor: '#F0FFF4' }]}>
        <Text style={[styles.infoTitle, { color: COLORS.success }]}>Avantages débloqués</Text>
        <Text style={styles.infoText}>• Investissement illimité (sans plafond KYC)</Text>
        <Text style={styles.infoText}>• Contrats Mousharaka complets</Text>
        <Text style={styles.infoText}>• Accès aux projets exclusifs</Text>
      </View>
    </View>
  );
}

function RejectedView({
  reason,
  onResubmit,
}: {
  reason?: string;
  onResubmit: () => void;
}) {
  return (
    <View style={styles.statusContainer}>
      <View style={[styles.statusIconBg, { backgroundColor: '#FADBD8' }]}>
        <Text style={styles.statusIcon}>❌</Text>
      </View>
      <Text style={styles.statusTitle}>Documents rejetés</Text>
      {reason ? (
        <View style={[styles.infoBox, { borderColor: COLORS.danger + '40', backgroundColor: '#FDF2F2' }]}>
          <Text style={[styles.infoTitle, { color: COLORS.danger }]}>Motif du rejet</Text>
          <Text style={styles.infoText}>{reason}</Text>
        </View>
      ) : null}
      <Text style={styles.statusText}>
        Veuillez soumettre à nouveau vos documents en vous assurant qu'ils sont lisibles et valides.
      </Text>
      <Button
        label="Soumettre à nouveau"
        onPress={onResubmit}
        style={{ marginTop: 8 }}
      />
    </View>
  );
}

// ─── Upload Form ──────────────────────────────────────────────────────────────

function UploadForm({ userId, onSuccess }: { userId: string; onSuccess: () => void }) {
  const [frontUri, setFrontUri] = useState<string | null>(null);
  const [backUri, setBackUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!frontUri || !backUri) return;
    setLoading(true);
    try {
      await submitKycDocuments(userId, 'ID_CARD', frontUri, backUri);
      onSuccess();
    } catch (e: any) {
      Alert.alert('Erreur', e?.message ?? 'Impossible de soumettre les documents. Réessayez.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <View>
      <View style={styles.infoBox}>
        <Text style={styles.infoTitle}>Documents acceptés</Text>
        <Text style={styles.infoText}>• Carte nationale d'identité mauritanienne</Text>
        <Text style={styles.infoText}>• Passeport en cours de validité</Text>
        <Text style={styles.infoText}>• Photos nettes, lisibles, sans reflets</Text>
      </View>

      <Text style={styles.uploadSectionLabel}>Recto (face avant)</Text>
      <ImagePickerCard
        label="Face avant"
        hint="Visage, nom, prénom, date de naissance"
        uri={frontUri}
        onPick={setFrontUri}
      />

      <Text style={styles.uploadSectionLabel}>Verso (face arrière)</Text>
      <ImagePickerCard
        label="Face arrière"
        hint="Numéro de document, date d'expiration"
        uri={backUri}
        onPick={setBackUri}
      />

      {loading && (
        <View style={styles.uploadProgress}>
          <ActivityIndicator color={COLORS.primary} />
          <Text style={styles.uploadProgressText}>Envoi des documents en cours…</Text>
        </View>
      )}

      <Button
        label="Soumettre pour vérification"
        onPress={handleSubmit}
        loading={loading}
        disabled={!frontUri || !backUri}
        style={{ marginTop: 8 }}
      />

      <Text style={styles.legalNote}>
        Vos documents sont chiffrés et traités conformément à notre politique de confidentialité.
        Ils ne seront utilisés qu'aux fins de vérification d'identité.
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

function KycContent() {
  const { user, setUser } = useAuthStore();
  const [forceUpload, setForceUpload] = useState(false);

  const kycStatus: KycStatus = user?.kycStatus ?? 'NONE';
  const showUploadForm = kycStatus === 'NONE' || (kycStatus === 'REJECTED' && forceUpload);

  function handleSuccess() {
    // Met à jour localement le store sans attendre Firestore
    if (user) setUser({ ...user, kycStatus: 'PENDING' });
    setForceUpload(false);
  }

  function renderBody() {
    if (kycStatus === 'VERIFIED') return <VerifiedView />;
    if (kycStatus === 'PENDING') return <PendingView />;
    if (kycStatus === 'REJECTED' && !forceUpload) {
      return (
        <RejectedView
          reason={user?.kycRejectionReason}
          onResubmit={() => setForceUpload(true)}
        />
      );
    }
    return (
      <UploadForm userId={user!.id} onSuccess={handleSuccess} />
    );
  }

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.container}>
      {/* Header */}
      <View style={styles.pageHeader}>
        <Text style={styles.pageTitle}>Vérification d'identité</Text>
        <Text style={styles.pageSubtitle}>
          La vérification KYC est requise pour investir au-delà de{' '}
          <Text style={styles.highlight}>5 000 MRU</Text>.
        </Text>

        {/* Stepper */}
        <View style={styles.stepper}>
          {(['Soumission', 'Examen', 'Décision'] as const).map((label, i) => {
            const stepDone =
              (i === 0 && kycStatus !== 'NONE') ||
              (i === 1 && (kycStatus === 'VERIFIED' || kycStatus === 'REJECTED')) ||
              (i === 2 && kycStatus === 'VERIFIED');
            const stepActive =
              (i === 0 && kycStatus === 'NONE') ||
              (i === 1 && kycStatus === 'PENDING') ||
              (i === 2 && (kycStatus === 'VERIFIED' || kycStatus === 'REJECTED'));
            return (
              <View key={label} style={styles.stepItem}>
                <View
                  style={[
                    styles.stepDot,
                    stepDone && styles.stepDotDone,
                    stepActive && styles.stepDotActive,
                  ]}
                >
                  <Text style={[styles.stepDotText, (stepDone || stepActive) && styles.stepDotTextActive]}>
                    {stepDone ? '✓' : String(i + 1)}
                  </Text>
                </View>
                <Text style={[styles.stepLabel, stepActive && styles.stepLabelActive]}>
                  {label}
                </Text>
                {i < 2 && <View style={[styles.stepLine, stepDone && styles.stepLineDone]} />}
              </View>
            );
          })}
        </View>
      </View>

      <View style={styles.body}>{renderBody()}</View>
    </ScrollView>
  );
}

export default function KycScreen() {
  return (
    <GuestGuard
      icon="🪪"
      title="Vérification d'identité"
      description="Connectez-vous pour soumettre votre pièce d'identité et débloquer l'investissement complet."
    >
      <KycContent />
    </GuestGuard>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: { paddingBottom: 40 },

  // Header
  pageHeader: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 28,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  pageSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.75)',
    lineHeight: 20,
    marginBottom: 24,
  },
  highlight: {
    color: COLORS.secondary,
    fontWeight: '700',
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  stepItem: {
    alignItems: 'center',
    position: 'relative',
    flex: 1,
  },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  stepDotActive: {
    backgroundColor: COLORS.secondary,
    borderColor: COLORS.secondary,
  },
  stepDotDone: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  stepDotText: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
  },
  stepDotTextActive: { color: '#fff' },
  stepLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
  },
  stepLabelActive: { color: '#fff', fontWeight: '600' },
  stepLine: {
    position: 'absolute',
    top: 14,
    left: '60%',
    right: '-60%',
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.2)',
    zIndex: -1,
  },
  stepLineDone: { backgroundColor: COLORS.success },

  body: { padding: 20 },

  // Info box
  infoBox: {
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: COLORS.primaryLight + '30',
  },
  infoTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 8,
  },
  infoStep: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
  },
  infoStepText: { fontSize: 11, color: '#fff', fontWeight: '700' },
  infoText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 20,
    flex: 1,
  },

  // Upload section
  uploadSectionLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
    marginBottom: 10,
  },
  imageCard: {
    height: 160,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    marginBottom: 20,
    overflow: 'hidden',
    backgroundColor: COLORS.surface,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  imagePlaceholderIcon: { fontSize: 32 },
  imagePlaceholderLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.textPrimary,
  },
  imagePlaceholderHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  previewImage: { width: '100%', height: '100%' },
  imageEditBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  imageEditText: { color: '#fff', fontSize: 12, fontWeight: '600' },

  // Upload progress
  uploadProgress: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    justifyContent: 'center',
    marginBottom: 16,
  },
  uploadProgressText: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },

  // Legal
  legalNote: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 16,
    marginTop: 16,
  },

  // Status views
  statusContainer: { alignItems: 'center', paddingVertical: 12, width: '100%' },
  statusIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  statusIcon: { fontSize: 36 },
  statusTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 8,
  },
});
