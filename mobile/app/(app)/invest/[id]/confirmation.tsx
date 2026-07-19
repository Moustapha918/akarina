import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { sharePDF, buildPDFFilename } from '../../../../src/utils/pdfShare';
import { COLORS } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { getProject } from '../../../../src/services/projectService';
import { getInvestment, updateInvestmentStatus } from '../../../../src/services/investmentService';
import { generateContractHTML } from '../../../../src/utils/contractTemplate';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';
import { Investment, Project } from '../../../../src/types';

export default function InvestConfirmationScreen() {
  const { id, investmentId, amount: amountParam } = useLocalSearchParams<{
    id: string;
    investmentId: string;
    amount: string;
  }>();
  const router = useRouter();
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
    });
  }, [id, investmentId]);

  async function handleDownloadContract() {
    if (!user || !project) return;
    setSharingPDF(true);
    try {
      const html = generateContractHTML(user, project, amount);
      await sharePDF(html, buildPDFFilename(project.title, user.name));
      await updateInvestmentStatus(investmentId, 'SUCCESS', { contractUrl: 'generated' });
    } catch {
      // annulation silencieuse
    } finally {
      setSharingPDF(false);
    }
  }

  function handleBackHome() {
    router.replace('/');
  }

  function handleViewDashboard() {
    router.replace('/dashboard');
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
        <Text style={styles.errorText}>Investissement introuvable.</Text>
        <Button label="Retour à l'accueil" onPress={handleBackHome} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const estimatedReturn = Math.round(amount * (project.roiEstimate / 100));
  const sharePercent = ((amount / project.targetAmount) * 100).toFixed(2);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
      >
        {/* Success header */}
        <View style={styles.successHeader}>
          <View style={styles.successCircle}>
            <Text style={styles.successIcon}>✓</Text>
          </View>
          <Text style={styles.successTitle}>Investissement confirmé !</Text>
          <Text style={styles.successSubtitle}>
            Bienvenue dans le projet <Text style={styles.bold}>{project.title}</Text>.
            Votre participation a bien été enregistrée.
          </Text>
        </View>

        {/* Investment summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.cardTitle}>Récapitulatif de votre investissement</Text>

          <Row label="Projet" value={project.title} />
          <Row label="Localisation" value={project.location} />
          <Divider />
          <Row label="Montant investi" value={formatMRU(amount)} highlight />
          <Row label="Part du projet" value={`${sharePercent}%`} />
          <Row label="Retour estimé" value={`+${formatMRU(estimatedReturn)}`} valueColor={COLORS.success} />
          <Row label="Total estimé" value={formatMRU(amount + estimatedReturn)} />
          <Divider />
          <Row label="ROI" value={`${project.roiEstimate}%`} />
          <Row label="Durée" value={`${project.roiDurationMonths} mois`} />
          <Row
            label="Référence Bankily"
            value={investment.bankilyRef ?? '—'}
            mono
          />
        </View>

        {/* Mousharaka info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🤝 Votre partenariat Mousharaka</Text>
          <Text style={styles.infoText}>
            En tant qu'associé, vous pouvez suivre l'avancement du chantier en temps réel depuis
            l'onglet <Text style={styles.bold}>Projets</Text>. Des photos et vidéos sont publiées
            régulièrement par l'équipe de construction.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            label="Télécharger le contrat PDF"
            onPress={handleDownloadContract}
            loading={sharingPDF}
            variant="outline"
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Voir mon portfolio"
            onPress={handleViewDashboard}
            style={{ marginBottom: 12 }}
          />
          <Button
            label="Retour à l'accueil"
            onPress={handleBackHome}
            variant="ghost"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Row({
  label,
  value,
  highlight = false,
  mono = false,
  valueColor,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  mono?: boolean;
  valueColor?: string;
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
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  label: { fontSize: 13, color: COLORS.textSecondary, flex: 1 },
  value: { fontSize: 13, fontWeight: '600', color: COLORS.textPrimary, flex: 1, textAlign: 'right' },
  valueHighlight: { fontSize: 16, fontWeight: '800', color: COLORS.primary },
  valueMono: { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', fontSize: 11 },
  divider: { height: 1, backgroundColor: COLORS.border, marginVertical: 4 },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    padding: 24,
  },
  scroll: { padding: 24, paddingBottom: 40 },

  // Success header
  successHeader: {
    alignItems: 'center',
    marginBottom: 28,
  },
  successCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  successIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  successTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.textPrimary,
    marginBottom: 8,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bold: { fontWeight: '700', color: COLORS.textPrimary },

  // Summary card
  summaryCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 16,
  },

  // Info card
  infoCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#AED6F1',
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: COLORS.primary, marginBottom: 8 },
  infoText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },

  // Actions
  actions: { marginTop: 4 },

  errorText: { fontSize: 15, color: COLORS.textSecondary },
});
