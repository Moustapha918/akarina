import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, BANKILY_SIMULATION_DELAY } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { formatMRU } from '../../../../src/utils/format';
import { initiatePayment } from '../../../../src/services/bankilyService';
import { updateInvestmentStatus } from '../../../../src/services/investmentService';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';

const TOTAL_SECONDS = Math.round(BANKILY_SIMULATION_DELAY / 1000);

type PaymentState = 'waiting' | 'processing' | 'success' | 'failed';

export default function InvestPaymentScreen() {
  const { id, investmentId, amount: amountParam } = useLocalSearchParams<{
    id: string; investmentId: string; amount: string;
  }>();
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
  const [paymentState, setPaymentState] = useState<PaymentState>('waiting');
  const [countdown, setCountdown] = useState(TOTAL_SECONDS);
  const [errorMessage, setErrorMessage] = useState('');

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    startPayment();
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  function startPulse() {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.12, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }

  async function startPayment() {
    if (!user) return;
    setPaymentState('processing');
    startPulse();

    let remaining = TOTAL_SECONDS;
    countdownRef.current = setInterval(() => {
      remaining -= 1;
      setCountdown(remaining);
      if (remaining <= 0 && countdownRef.current) clearInterval(countdownRef.current);
    }, 1000);

    try {
      const result = await initiatePayment(amount, user.phone, investmentId);
      pulseAnim.stopAnimation();
      if (countdownRef.current) clearInterval(countdownRef.current);

      if (result.success) {
        await updateInvestmentStatus(investmentId, 'SUCCESS', { bankilyRef: result.bankilyRef });
        setPaymentState('success');
        setTimeout(() => {
          router.replace(`/invest/${id}/confirmation?investmentId=${investmentId}&amount=${amount}`);
        }, 1200);
      } else {
        await updateInvestmentStatus(investmentId, 'FAILED');
        setErrorMessage(result.errorMessage ?? t('invest.payment.failed'));
        setPaymentState('failed');
      }
    } catch {
      pulseAnim.stopAnimation();
      if (countdownRef.current) clearInterval(countdownRef.current);
      await updateInvestmentStatus(investmentId, 'FAILED').catch(() => {});
      setErrorMessage(t('invest.payment.networkError'));
      setPaymentState('failed');
    }
  }

  async function handleRetry() {
    setErrorMessage('');
    setCountdown(TOTAL_SECONDS);
    await startPayment();
  }

  function handleCancel() {
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {STEPS.map((step, i) => (
          <View key={step} style={styles.stepItem}>
            <View style={[styles.stepDot, i === 2 && styles.stepDotActive]}>
              <Text style={i === 2 ? styles.stepNumber : styles.stepNumberInactive}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === 2 && styles.stepLabelActive]}>{step}</Text>
          </View>
        ))}
      </View>

      <View style={styles.body}>
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>{t('invest.payment.amountLabel')}</Text>
          <Text style={styles.amountValue}>{formatMRU(amount)}</Text>
        </View>

        {paymentState === 'processing' && (
          <View style={styles.stateBlock}>
            <Animated.View style={[styles.bankiLyCircle, { transform: [{ scale: pulseAnim }] }]}>
              <Text style={styles.bankiLyLetter}>B</Text>
            </Animated.View>
            <Text style={styles.stateTitle}>{t('invest.payment.processing')}</Text>
            <Text style={styles.stateSubtitle}>
              {t('invest.payment.otpSent')}{'\n'}
              <Text style={styles.phoneHighlight}>{user?.phone ?? '—'}</Text>
            </Text>
            <Text style={styles.stateSubtitle}>{t('invest.payment.validateOnPhone')}</Text>
            <View style={styles.countdownRow}>
              <ActivityIndicator color={COLORS.primary} size="small" />
              <Text style={styles.countdownText}>{t('invest.payment.countdown', { count: countdown })}</Text>
            </View>
            <Text style={styles.simulationNote}>{t('invest.payment.simulationNote')}</Text>
          </View>
        )}

        {paymentState === 'success' && (
          <View style={styles.stateBlock}>
            <View style={styles.successCircle}>
              <Text style={styles.successIcon}>✓</Text>
            </View>
            <Text style={styles.stateTitle}>{t('invest.payment.success')}</Text>
            <Text style={styles.stateSubtitle}>{t('invest.payment.redirecting')}</Text>
          </View>
        )}

        {paymentState === 'failed' && (
          <View style={styles.stateBlock}>
            <View style={styles.failedCircle}>
              <Text style={styles.failedIcon}>✕</Text>
            </View>
            <Text style={styles.stateTitle}>{t('invest.payment.failed')}</Text>
            <Text style={[styles.stateSubtitle, { color: COLORS.danger }]}>{errorMessage}</Text>
            <Button label={t('invest.payment.retry')} onPress={handleRetry} style={{ marginTop: 24, width: 200 }} />
            <Button label={t('invest.payment.cancel')} onPress={handleCancel} variant="ghost" style={{ marginTop: 8 }} />
          </View>
        )}

        {paymentState === 'waiting' && (
          <View style={styles.stateBlock}>
            <ActivityIndicator color={COLORS.primary} size="large" />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  amountCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center',
    marginBottom: 40, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  amountLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  stateBlock: { alignItems: 'center', width: '100%' },
  bankiLyCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  bankiLyLetter: { fontSize: 36, fontWeight: '900', color: '#fff' },
  stateTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  stateSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  phoneHighlight: { fontWeight: '700', color: COLORS.primary },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 20, backgroundColor: COLORS.background,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  countdownText: { fontSize: 14, color: COLORS.textSecondary, fontWeight: '600' },
  simulationNote: { marginTop: 24, fontSize: 12, color: COLORS.warning, textAlign: 'center', fontStyle: 'italic' },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  failedCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  failedIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
});
