import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  COLORS,
  INVESTMENT_PRESETS,
  MIN_INVESTMENT_AMOUNT,
  MAX_INVESTMENT_AMOUNT,
  KYC_FREE_THRESHOLD,
} from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { getProject } from '../../../../src/services/projectService';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';
import { Project } from '../../../../src/types';

const STEPS = ['Montant', 'Contrat', 'Paiement', 'Confirmation'];

export default function InvestAmountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [amount, setAmount] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    getProject(id).then((p) => {
      setProject(p);
      setLoadingProject(false);
    });
  }, [id]);

  function selectPreset(preset: number) {
    setSelectedPreset(preset);
    setAmount(String(preset));
    setError('');
  }

  function handleAmountChange(text: string) {
    setSelectedPreset(null);
    setAmount(text.replace(/[^0-9]/g, ''));
    setError('');
  }

  function validate(): boolean {
    const num = parseInt(amount, 10);
    if (!num || isNaN(num)) {
      setError('Veuillez saisir un montant.');
      return false;
    }
    if (project && num < project.minInvestment) {
      setError(`Le montant minimum pour ce projet est ${formatMRU(project.minInvestment)}.`);
      return false;
    }
    if (num < MIN_INVESTMENT_AMOUNT) {
      setError(`Le montant minimum est ${formatMRU(MIN_INVESTMENT_AMOUNT)}.`);
      return false;
    }
    if (num > MAX_INVESTMENT_AMOUNT) {
      setError(`Le montant maximum est ${formatMRU(MAX_INVESTMENT_AMOUNT)}.`);
      return false;
    }
    if (num > KYC_FREE_THRESHOLD && user?.kycStatus !== 'VERIFIED') {
      setError(
        `Au-delà de ${formatMRU(KYC_FREE_THRESHOLD)}, une vérification d'identité (KYC) est requise. Complétez votre KYC depuis votre profil.`
      );
      return false;
    }
    return true;
  }

  function handleContinue() {
    if (!validate()) return;
    router.push(`/invest/${id}/contract?amount=${amount}`);
  }

  if (loadingProject) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!project) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Projet introuvable.</Text>
      </View>
    );
  }

  const num = parseInt(amount, 10) || 0;
  const estimatedROI = num > 0 ? Math.round(num * (project.roiEstimate / 100)) : 0;
  const availablePresets = INVESTMENT_PRESETS.filter((p) => p >= project.minInvestment);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Step indicator */}
        <View style={styles.stepsRow}>
          {STEPS.map((step, i) => (
            <View key={step} style={styles.stepItem}>
              <View style={[styles.stepDot, i === 0 && styles.stepDotActive]}>
                {i === 0 ? (
                  <Text style={styles.stepNumber}>1</Text>
                ) : (
                  <Text style={styles.stepNumberInactive}>{i + 1}</Text>
                )}
              </View>
              <Text style={[styles.stepLabel, i === 0 && styles.stepLabelActive]}>{step}</Text>
              {i < STEPS.length - 1 && (
                <View style={[styles.stepLine, i === 0 && styles.stepLineActive]} />
              )}
            </View>
          ))}
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Project card */}
          <View style={styles.projectCard}>
            <Text style={styles.projectTitle} numberOfLines={2}>{project.title}</Text>
            <View style={styles.projectMeta}>
              <Text style={styles.metaChip}>📍 {project.location}</Text>
              <Text style={styles.metaChip}>📈 {project.roiEstimate}% / {project.roiDurationMonths} mois</Text>
              <Text style={styles.metaChip}>💰 Min: {formatMRU(project.minInvestment)}</Text>
            </View>
          </View>

          {/* Preset amounts */}
          {availablePresets.length > 0 && (
            <>
              <Text style={styles.sectionLabel}>Montants suggérés</Text>
              <View style={styles.presetsGrid}>
                {availablePresets.map((preset) => (
                  <TouchableOpacity
                    key={preset}
                    style={[styles.presetBtn, selectedPreset === preset && styles.presetBtnActive]}
                    onPress={() => selectPreset(preset)}
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        selectedPreset === preset && styles.presetTextActive,
                      ]}
                    >
                      {formatMRU(preset, true)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {/* Custom amount */}
          <Text style={styles.sectionLabel}>Montant personnalisé (MRU)</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.amountInput}
              value={amount}
              onChangeText={handleAmountChange}
              keyboardType="numeric"
              placeholder="Ex: 15 000"
              placeholderTextColor={COLORS.disabled}
            />
            <View style={styles.currencyBadge}>
              <Text style={styles.currencyText}>MRU</Text>
            </View>
          </View>

          {/* Error */}
          {!!error && (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>⚠️ {error}</Text>
            </View>
          )}

          {/* ROI preview */}
          {num > 0 && !error && (
            <View style={styles.roiBox}>
              <View style={styles.roiRow}>
                <Text style={styles.roiLabel}>Votre participation</Text>
                <Text style={styles.roiValue}>{formatMRU(num)}</Text>
              </View>
              <View style={[styles.roiRow, { marginTop: 8 }]}>
                <Text style={styles.roiLabel}>Retour estimé ({project.roiEstimate}%)</Text>
                <Text style={[styles.roiValue, { color: COLORS.success }]}>+{formatMRU(estimatedROI)}</Text>
              </View>
              <View style={[styles.roiRow, { marginTop: 8 }]}>
                <Text style={styles.roiLabel}>Total estimé</Text>
                <Text style={[styles.roiValue, { fontWeight: '700' }]}>{formatMRU(num + estimatedROI)}</Text>
              </View>
              <Text style={styles.roiDisclaimer}>
                *Estimation non garantie. Basée sur les projections du marché immobilier mauritanien.
              </Text>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          <Button
            label={`Continuer avec ${num > 0 ? formatMRU(num) : '—'}`}
            onPress={handleContinue}
            disabled={!amount}
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },

  // Steps
  stepsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepItem: { flex: 1, alignItems: 'center', position: 'relative' },
  stepDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepNumberInactive: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  stepLabel: { fontSize: 10, color: COLORS.textSecondary, textAlign: 'center' },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  stepLine: {
    position: 'absolute',
    right: -8,
    top: 14,
    width: 16,
    height: 1,
    backgroundColor: COLORS.border,
  },
  stepLineActive: { backgroundColor: COLORS.primary },

  scroll: { padding: 20, paddingBottom: 32 },

  // Project card
  projectCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  projectTitle: { fontSize: 17, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12 },
  projectMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  metaChip: {
    fontSize: 12,
    color: COLORS.textSecondary,
    backgroundColor: COLORS.background,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // Presets
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  presetsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  presetBtn: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  presetBtnActive: { borderColor: COLORS.primary, backgroundColor: '#EBF5FB' },
  presetText: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  presetTextActive: { color: COLORS.primary },

  // Input
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    marginBottom: 16,
    overflow: 'hidden',
  },
  amountInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  currencyBadge: {
    backgroundColor: COLORS.background,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderLeftWidth: 1,
    borderLeftColor: COLORS.border,
  },
  currencyText: { fontSize: 14, fontWeight: '600', color: COLORS.textSecondary },

  // Error
  errorBox: {
    backgroundColor: '#FDEDEC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { fontSize: 13, color: COLORS.danger, lineHeight: 18 },

  // ROI box
  roiBox: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginTop: 8,
  },
  roiRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  roiLabel: { fontSize: 13, color: COLORS.textSecondary },
  roiValue: { fontSize: 14, fontWeight: '600', color: COLORS.textPrimary },
  roiDisclaimer: { fontSize: 10, color: COLORS.disabled, marginTop: 12, fontStyle: 'italic' },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
