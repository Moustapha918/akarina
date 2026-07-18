import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { COLORS } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { getProject } from '../../../../src/services/projectService';
import { createInvestment, markContractAccepted } from '../../../../src/services/investmentService';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';
import { Project } from '../../../../src/types';

const STEPS = ['Montant', 'Contrat', 'Paiement', 'Confirmation'];

export default function InvestContractScreen() {
  const { id, amount: amountParam } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();
  const { user } = useAuthStore();

  const amount = parseInt(amountParam, 10);
  const [project, setProject] = useState<Project | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [accepted, setAccepted] = useState(false);
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    getProject(id).then((p) => {
      setProject(p);
      setLoadingProject(false);
    });
  }, [id]);

  function handleScroll({ nativeEvent }: { nativeEvent: any }) {
    const { layoutMeasurement, contentOffset, contentSize } = nativeEvent;
    const isAtBottom = layoutMeasurement.height + contentOffset.y >= contentSize.height - 40;
    if (isAtBottom) setHasScrolledToBottom(true);
  }

  async function handleAccept() {
    if (!user || !project) return;
    if (!accepted) {
      Alert.alert('Contrat', 'Veuillez cocher la case pour accepter les termes du contrat.');
      return;
    }

    setSubmitting(true);
    try {
      const investment = await createInvestment(
        { projectId: id, amount },
        user.id
      );
      await markContractAccepted(investment.id);
      router.push(`/invest/${id}/payment?investmentId=${investment.id}&amount=${amount}`);
    } catch (err) {
      Alert.alert('Erreur', 'Impossible de créer l\'investissement. Réessayez.');
      setSubmitting(false);
    }
  }

  if (loadingProject || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} />
      </View>
    );
  }

  const sharePercent = ((amount / project.targetAmount) * 100).toFixed(2);
  const estimatedReturn = Math.round(amount * (project.roiEstimate / 100));

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepDot, i === 1 && styles.stepDotActive]}>
              <Text style={i === 1 ? styles.stepNumber : styles.stepNumberInactive}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === 1 && styles.stepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      {/* Investment summary banner */}
      <View style={styles.summaryBanner}>
        <Text style={styles.summaryTitle}>{project.title}</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Votre investissement</Text>
            <Text style={styles.summaryValue}>{formatMRU(amount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Part du projet</Text>
            <Text style={styles.summaryValue}>{sharePercent}%</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>Retour estimé</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>
              +{formatMRU(estimatedReturn)}
            </Text>
          </View>
        </View>
      </View>

      {/* Contract text */}
      <ScrollView
        ref={scrollRef}
        style={styles.contractScroll}
        contentContainerStyle={styles.contractContent}
        onScroll={handleScroll}
        scrollEventThrottle={100}
        showsVerticalScrollIndicator
      >
        <Text style={styles.contractTitle}>CONTRAT DE PARTENARIAT MOUSHARAKA</Text>
        <Text style={styles.contractSubtitle}>
          Conforme aux principes de la Finance Islamique (Sharia) · Droit mauritanien
        </Text>

        <Section title="PARTIES CONTRACTANTES">
          <Text style={styles.contractText}>
            <Text style={styles.bold}>La Société Gérante :</Text> Akarina SARL, société
            mauritanienne enregistrée au registre de commerce de Nouakchott.{'\n\n'}
            <Text style={styles.bold}>L'Associé Investisseur :</Text>{' '}
            {user?.name ?? '—'} · {user?.phone ?? '—'}
          </Text>
        </Section>

        <Section title="OBJET DU PARTENARIAT">
          <Text style={styles.contractText}>
            Ce contrat définit les termes d'un partenariat de type <Text style={styles.bold}>Mousharaka</Text>{' '}
            pour le co-financement du projet immobilier <Text style={styles.bold}>"{project.title}"</Text>,
            situé à <Text style={styles.bold}>{project.location}</Text>, Mauritanie.
            {'\n\n'}
            Montant total du projet : <Text style={styles.bold}>{formatMRU(project.targetAmount)}</Text>.
            {'\n'}
            Durée estimée : <Text style={styles.bold}>{project.roiDurationMonths} mois</Text>.
          </Text>
        </Section>

        <Section title="CONDITIONS DU PARTENARIAT">
          <Clause num={1} title="Nature Sharia-compliant">
            Ce partenariat est de type Mousharaka, approuvé selon les principes de la finance
            islamique. Aucun intérêt (Riba) n'est appliqué. Les profits sont partagés
            proportionnellement aux apports ; les pertes éventuelles sont supportées à proportion
            des participations.
          </Clause>

          <Clause num={2} title="Utilisation exclusive des fonds">
            Les fonds versés par l'associé sont exclusivement dédiés au financement du projet
            mentionné. Aucun détournement ni activité prohibée (Haram) n'est autorisé.
          </Clause>

          <Clause num={3} title="Retour sur investissement">
            Le taux de retour estimé de <Text style={styles.bold}>{project.roiEstimate}%</Text>{' '}
            sur <Text style={styles.bold}>{project.roiDurationMonths} mois</Text> est basé sur
            les études de marché immobilier mauritanien. Il ne constitue pas une garantie
            contractuelle de rendement. Les conditions réelles peuvent varier.
          </Clause>

          <Clause num={4} title="Transparence et reporting">
            L'associé a accès en temps réel via l'application Akarina aux rapports d'avancement
            du chantier : photos, vidéos, jalons. Des rapports financiers trimestriels seront
            communiqués.
          </Clause>

          <Clause num={5} title="Gouvernance">
            Akarina SARL assure la gestion opérationnelle du projet. L'associé n'intervient pas
            dans les décisions de gestion courante mais est informé de toute décision majeure
            affectant sa participation.
          </Clause>

          <Clause num={6} title="Liquidité">
            La participation n'est pas librement cessible avant l'achèvement du projet, sauf
            accord exprès d'Akarina SARL ou mise en place d'un mécanisme de marché secondaire
            ultérieur.
          </Clause>

          <Clause num={7} title="Droit applicable">
            Ce contrat est régi par le droit mauritanien et les principes de la finance islamique.
            Tout litige sera soumis aux juridictions compétentes de Nouakchott.
          </Clause>
        </Section>

        {!hasScrolledToBottom && (
          <TouchableOpacity
            style={styles.scrollHint}
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text style={styles.scrollHintText}>↓ Défiler pour lire la totalité du contrat</Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* Accept + CTA */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.checkboxRow}
          onPress={() => setAccepted(!accepted)}
          activeOpacity={0.7}
        >
          <View style={[styles.checkbox, accepted && styles.checkboxChecked]}>
            {accepted && <Text style={styles.checkmark}>✓</Text>}
          </View>
          <Text style={styles.checkboxLabel}>
            J'ai lu et j'accepte les termes du contrat de partenariat Mousharaka ci-dessus.
          </Text>
        </TouchableOpacity>

        <Button
          label="Signer et procéder au paiement →"
          onPress={handleAccept}
          disabled={!accepted}
          loading={submitting}
          style={{ marginTop: 12 }}
        />
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Clause({
  num,
  title,
  children,
}: {
  num: number;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.clause}>
      <Text style={styles.clauseTitle}>Art. {num} – {title}</Text>
      <Text style={styles.contractText}>{children}</Text>
    </View>
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
    paddingVertical: 12,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  stepItem: { flex: 1, alignItems: 'center' },
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
  stepLabel: { fontSize: 10, color: COLORS.textSecondary },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },

  // Summary banner
  summaryBanner: {
    backgroundColor: COLORS.primary,
    padding: 16,
  },
  summaryTitle: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 12,
    opacity: 0.9,
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginBottom: 2 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },

  // Contract
  contractScroll: { flex: 1 },
  contractContent: { padding: 20, paddingBottom: 8 },
  contractTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.primary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 10,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  clause: { marginBottom: 12 },
  clauseTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  contractText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: COLORS.textPrimary },
  scrollHint: {
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  scrollHintText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },

  // Footer
  footer: {
    padding: 20,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
