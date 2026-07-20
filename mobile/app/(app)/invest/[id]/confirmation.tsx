import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { sharePDF, buildPDFFilename } from '../../../../src/utils/pdfShare';
import { uploadContractPDF } from '../../../../src/utils/pdfStorage';
import { COLORS } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { getProject } from '../../../../src/services/projectService';
import { getInvestment, updateContractUrl } from '../../../../src/services/investmentService';
import { generateContractHTML } from '../../../../src/utils/contractTemplate';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';
import { Investment, Project } from '../../../../src/types';

export default function InvestConfirmationScreen() {
  const { id, investmentId, amount: amountParam } = useLocalSearchParams<{
    id: string; investmentId: string; amount: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const amount = parseInt(amountParam, 10);
  const [project, setProject] = useState<Project | null>(null);
  const [investment, setInvestment] = useState<Investment | null>(null);
  const [loading, setLoading] = useState(true);
  const [sharingPDF, setSharingPDF] = useState(false);

  useEffect(() => {
    Promise.all([getProject(id), getInvestment(investmentId)]).then(([p, inv]) => {
      setProject(p);
      setInvestment(inv);
      setLoading(false);

      // Auto-upload du contrat en arrière-plan si pas encore persisté
      if (p && inv && user && !inv.contractUrl) {
        const html = generateContractHTML(user, p, parseInt(amountParam, 10), investmentId);
        uploadContractPDF(html, investmentId, user.id)
          .then((url) => updateContractUrl(investmentId, url))
          .catch((err) => console.error('[Contract] Auto-upload Storage échoué:', err));
      }
    });
  }, [id, investmentId]);

  async function handleDownloadContract() {
    if (!user || !project) return;
    setSharingPDF(true);
    try {
      const html = generateContractHTML(user, project, amount, investmentId);
      await sharePDF(html, buildPDFFilename(project.title, user.name));
      // Upload vers Firebase Storage si pas encore persisté
      if (investment && !investment.contractUrl) {
        uploadContractPDF(html, investmentId, user.id)
          .then((url) => updateContractUrl(investmentId, url))
          .catch((err) => console.error('[Contract] Upload Storage échoué:', err));
      }
    } catch (err) {
      console.error('[Contract] Partage PDF échoué:', err);
      Alert.alert(t('common.error'), t('invest.contract.pdfError'));
    } finally {
      setSharingPDF(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  if (!project || !investment) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>{t('invest.confirmation.notFound')}</Text>
        <Button label={t('invest.confirmation.backHome')} onPress={() => router.replace('/')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const estimatedReturn = Math.round(amount * (project.roiEstimate / 100));
  const sharePercent = ((amount / project.targetAmount) * 100).toFixed(2);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Success header */}
        <View style={styles.successHeader}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>{t('invest.confirmation.title')}</Text>
          <Text style={styles.successSubtitle}>
            {t('invest.confirmation.subtitle', { title: project.title })}
          </Text>
        </View>

        {/* Investment summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>{t('invest.confirmation.summaryTitle')}</Text>
          <Row label={t('invest.confirmation.rowProject')} value={project.title} />
          <Row label={t('invest.confirmation.rowLocation')} value={project.location} />
          <Divider />
          <Row label={t('invest.confirmation.rowInvested')} value={formatMRU(amount)} highlight />
          <Row label={t('invest.confirmation.rowShare')} value={`${sharePercent}%`} />
          <Row label={t('invest.confirmation.rowReturn')} value={`+${formatMRU(estimatedReturn)}`} valueColor={COLORS.success} />
          <Row label={t('invest.confirmation.rowTotal')} value={formatMRU(amount + estimatedReturn)} />
          <Divider />
          <Row label={t('invest.confirmation.rowRoi')} value={`${project.roiEstimate}%`} />
          <Row label={t('invest.confirmation.rowDuration')} value={t('invest.confirmation.rowDurationValue', { count: project.roiDurationMonths })} />
          <Row label={t('invest.confirmation.rowBankilyRef')} value={investment.bankilyRef ?? '—'} mono />
        </View>

        {/* Mousharaka info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>{t('invest.confirmation.mousharakaTitle')}</Text>
          <Text style={styles.infoText}>{t('invest.confirmation.mousharakaText')}</Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label={t('invest.confirmation.downloadPdf')}
            onPress={handleDownloadContract}
            loading={sharingPDF}
            variant="outline"
            style={{ marginBottom: 12 }}
          />
          <Button
            label={t('invest.confirmation.viewPortfolio')}
            onPress={() => router.replace('/dashboard')}
            style={{ marginBottom: 12 }}
          />
          <Button
            label={t('invest.confirmation.backHome')}
            onPress={() => router.replace('/')}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label, value, highlight = false, mono = false, valueColor,
}: {
  label: string; value: string; highlight?: boolean; mono?: boolean; valueColor?: string;
}) {
  return (
    <View style={rowStyles.row}>
      <Text style={rowStyles.label}>{label}</Text>
      <Text
        style={[
          rowStyles.value,
          highlight && rowStyles.valueHighlight,
          mono && rowStyles.valueMono,
          valueColor ? { color: valueColor } : null,
        ]}
        numberOfLines={1}
      >
        {value}
      </Text>
    </View>
  );
}

function Divider() {
  return <View style={rowStyles.divider} />;
}

const rowStyles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  label: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1, textAlign: 'auto' },
  valueHighlight: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  valueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    backgroundColor: COLORS.background, padding: 24,
  },
  scroll: { padding: 24, paddingBottom: 40 },
  successHeader: { alignItems: 'center', marginBottom: 28 },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
    shadowColor: COLORS.success, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  successIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  successTitle: { fontSize: 24, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 8, textAlign: 'center' },
  successSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 },
  summaryCard: {
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 20, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  cardTitle: { fontSize: 14, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 16 },
  infoCard: {
    backgroundColor: '#EBF5FB', borderRadius: 16, padding: 16, marginBottom: 24,
    borderWidth: 1, borderColor: '#AED6F1',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  actions: { marginTop: 4 },
  errorText: { fontSize: 15, color: COLORS.textSecondary },
});
