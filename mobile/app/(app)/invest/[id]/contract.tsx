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
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { getProject } from '../../../../src/services/projectService';
import { createInvestment, markContractAccepted } from '../../../../src/services/investmentService';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';
import { Project } from '../../../../src/types';

export default function InvestContractScreen() {
  const { id, amount: amountParam } = useLocalSearchParams<{ id: string; amount: string }>();
  const router = useRouter();
  const { t } = useTranslation();
  const { user } = useAuthStore();

  const STEPS = [
    t('invest.steps.amount'),
    t('invest.steps.contract'),
    t('invest.steps.payment'),
    t('invest.steps.confirmation'),
  ];

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
      Alert.alert(t('invest.steps.contract'), t('invest.contract.mustAccept'));
      return;
    }

    setSubmitting(true);
    try {
      const investment = await createInvestment({ projectId: id, amount }, user.id);
      await markContractAccepted(investment.id);
      router.push(`/invest/${id}/payment?investmentId=${investment.id}&amount=${amount}`);
    } catch {
      Alert.alert(t('common.error'), t('invest.contract.createError'));
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
            <Text style={styles.summaryLabel}>{t('invest.contract.yourInvestment')}</Text>
            <Text style={styles.summaryValue}>{formatMRU(amount)}</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('invest.contract.shareOfProject')}</Text>
            <Text style={styles.summaryValue}>{sharePercent}%</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>{t('invest.contract.estimatedReturn')}</Text>
            <Text style={[styles.summaryValue, { color: COLORS.success }]}>+{formatMRU(estimatedReturn)}</Text>
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
        <Text style={styles.contractTitle}>{t('invest.contract.title')}</Text>
        <Text style={styles.contractSubtitle}>{t('invest.contract.subtitle')}</Text>

        <Section title={t('invest.contract.sectionParties')}>
          <Text style={styles.contractText}>
            <Text style={styles.bold}>{t('invest.contract.managingCompany')}</Text>{' '}
            {t('invest.contract.managingCompanyDesc')}{'\n\n'}
            <Text style={styles.bold}>{t('invest.contract.investor')}</Text>{' '}
            {user?.name ?? '—'} · {user?.phone ?? '—'}
          </Text>
        </Section>

        <Section title={t('invest.contract.sectionObject')}>
          <Text style={styles.contractText}>
            {t('invest.contract.objectDesc', { title: project.title, location: project.location })}
            {'\n\n'}
            {t('invest.contract.totalAmount')}{' '}<Text style={styles.bold}>{formatMRU(project.targetAmount)}</Text>.
            {'\n'}
            {t('invest.contract.estimatedDuration')}{' '}<Text style={styles.bold}>{project.roiDurationMonths} {t('invest.contract.months')}</Text>.
          </Text>
        </Section>

        <Section title={t('invest.contract.sectionConditions')}>
          <Clause num={1} title={t('invest.contract.art1Title')}>{t('invest.contract.art1Body')}</Clause>
          <Clause num={2} title={t('invest.contract.art2Title')}>{t('invest.contract.art2Body')}</Clause>
          <Clause num={3} title={t('invest.contract.art3Title')}>
            {t('invest.contract.art3Body', { roi: project.roiEstimate, duration: project.roiDurationMonths })}
          </Clause>
          <Clause num={4} title={t('invest.contract.art4Title')}>{t('invest.contract.art4Body')}</Clause>
          <Clause num={5} title={t('invest.contract.art5Title')}>{t('invest.contract.art5Body')}</Clause>
          <Clause num={6} title={t('invest.contract.art6Title')}>{t('invest.contract.art6Body')}</Clause>
          <Clause num={7} title={t('invest.contract.art7Title')}>{t('invest.contract.art7Body')}</Clause>
        </Section>

        {!hasScrolledToBottom && (
          <TouchableOpacity
            style={styles.scrollHint}
            onPress={() => scrollRef.current?.scrollToEnd({ animated: true })}
          >
            <Text style={styles.scrollHintText}>{t('invest.contract.scrollHint')}</Text>
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
          <Text style={styles.checkboxLabel}>{t('invest.contract.acceptCheckbox')}</Text>
        </TouchableOpacity>

        <Button
          label={t('invest.contract.signAndPay')}
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

function Clause({ num, title, children }: { num: number; title: string; children: React.ReactNode }) {
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
  stepsRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  stepItem: { flex: 1, alignItems: 'center' },
  stepDot: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: COLORS.border, justifyContent: 'center', alignItems: 'center', marginBottom: 4,
  },
  stepDotActive: { backgroundColor: COLORS.primary },
  stepNumber: { fontSize: 12, fontWeight: '700', color: '#fff' },
  stepNumberInactive: { fontSize: 12, fontWeight: '600', color: COLORS.textSecondary },
  stepLabel: { fontSize: 10, color: COLORS.textSecondary },
  stepLabelActive: { color: COLORS.primary, fontWeight: '600' },
  summaryBanner: { backgroundColor: COLORS.primary, padding: 16 },
  summaryTitle: { color: '#fff', fontSize: 14, fontWeight: '700', marginBottom: 12, opacity: 0.9 },
  summaryRow: { flexDirection: 'row', alignItems: 'center' },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { color: 'rgba(255,255,255,0.7)', fontSize: 10, marginBottom: 2 },
  summaryValue: { color: '#fff', fontSize: 14, fontWeight: '700' },
  summaryDivider: { width: 1, height: 32, backgroundColor: 'rgba(255,255,255,0.2)' },
  contractScroll: { flex: 1 },
  contractContent: { padding: 20, paddingBottom: 8 },
  contractTitle: {
    fontSize: 15, fontWeight: '800', color: COLORS.primary, textAlign: 'center', marginBottom: 4,
  },
  contractSubtitle: {
    fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20,
  },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 11, fontWeight: '700', color: COLORS.primary,
    textTransform: 'uppercase', letterSpacing: 1,
    marginBottom: 10, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  clause: { marginBottom: 12 },
  clauseTitle: { fontSize: 13, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 4 },
  contractText: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  bold: { fontWeight: '700', color: COLORS.textPrimary },
  scrollHint: { alignItems: 'center', paddingVertical: 12, marginTop: 8 },
  scrollHintText: { color: COLORS.primary, fontSize: 13, fontWeight: '600' },
  footer: {
    padding: 20, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  checkboxRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 12 },
  checkbox: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center', marginTop: 1, flexShrink: 0,
  },
  checkboxChecked: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkmark: { color: '#fff', fontSize: 14, fontWeight: '700' },
  checkboxLabel: { flex: 1, fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
});
