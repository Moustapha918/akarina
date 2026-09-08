import { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import {
  COLORS,
  BANKILY_POLL_INTERVAL,
  BANKILY_POLL_TIMEOUT,
  BANKILY_MERCHANT_CODE,
  PHONE_PREFIX,
  MAURITANIAN_PHONE_REGEX,
} from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { Input } from '../../../../src/components/ui/Input';
import { formatMRU } from '../../../../src/utils/format';
import { initiatePayment, checkTransactionStatus, BankilyCallError } from '../../../../src/services/bankilyService';
import { useAuthStore } from '../../../../src/hooks/useAuthStore';

type PaymentStep = 'instructions' | 'form' | 'processing' | 'success' | 'failed' | 'pending';

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

  const [step, setStep] = useState<PaymentStep>('instructions');
  const [phoneDigits, setPhoneDigits] = useState(
    user?.phone?.startsWith(PHONE_PREFIX) ? user.phone.slice(PHONE_PREFIX.length) : ''
  );
  const [passcode, setPasscode] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ phone?: string; passcode?: string }>({});
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  /** true si le paiement est définitivement refusé par Bankily (operationId consommé, pas de retry). */
  const [terminal, setTerminal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef(0);

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
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

  function validate(): boolean {
    const errors: { phone?: string; passcode?: string } = {};
    if (!MAURITANIAN_PHONE_REGEX.test(`${PHONE_PREFIX}${phoneDigits}`)) {
      errors.phone = t('invest.payment.phoneError');
    }
    if (passcode.trim().length < 4) {
      errors.passcode = t('invest.payment.passcodeError');
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  }

  async function handleSubmitPayment() {
    if (!validate()) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      await initiatePayment(investmentId, phoneDigits, passcode.trim());
      setPasscode('');
      setStep('processing');
      startPulse();
      startPolling();
    } catch (err) {
      const code = err instanceof BankilyCallError ? err.code : 'unknown';
      setPasscode('');

      if (code === 'unavailable' || code === 'failed-precondition') {
        // Issue réseau ambiguë ("unavailable") ou paiement déjà pris en charge côté
        // serveur ("failed-precondition", ex. une tentative précédente a réussi malgré
        // un timeout client) : jamais interpréter comme un échec, toujours vérifier le
        // vrai statut via checkTransaction plutôt que de le supposer.
        setStep('processing');
        startPulse();
        startPolling();
        return;
      }

      // 'aborted' = rejet Bankily propre (passcode invalide...) : non terminal, un nouveau
      // passcode peut être retenté sur le même investissement (toujours PENDING).
      // Tout le reste (permission/auth/erreur interne...) : terminal, retenter ne réglera rien.
      setTerminal(code !== 'aborted');
      setErrorMessage(
        err instanceof BankilyCallError && err.message ? err.message : t('invest.payment.genericError')
      );
      setStep('failed');
    } finally {
      setSubmitting(false);
    }
  }

  function startPolling() {
    pollStartRef.current = Date.now();
    pollRef.current = setInterval(async () => {
      try {
        const status = await checkTransactionStatus(investmentId);
        if (status === 'TS') {
          stopPolling();
          setStep('success');
          setTimeout(() => {
            router.replace(`/invest/${id}/confirmation?investmentId=${investmentId}&amount=${amount}`);
          }, 1200);
          return;
        }
        if (status === 'TF') {
          stopPolling();
          setTerminal(true);
          setErrorMessage(t('invest.payment.failed'));
          setStep('failed');
          return;
        }
        // status === 'TA' : toujours en attente côté Bankily
        if (Date.now() - pollStartRef.current >= BANKILY_POLL_TIMEOUT) {
          stopPolling();
          setStep('pending');
        }
      } catch (err) {
        console.error('[Payment] Erreur pendant le polling checkTransaction:', err);
        // Anomalie réseau ponctuelle : on continue le polling jusqu'au timeout global.
        if (Date.now() - pollStartRef.current >= BANKILY_POLL_TIMEOUT) {
          stopPolling();
          setStep('pending');
        }
      }
    }, BANKILY_POLL_INTERVAL);
  }

  function stopPolling() {
    pulseAnim.stopAnimation();
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  function handleRetry() {
    setErrorMessage('');
    setStep('instructions');
  }

  function handleCancel() {
    router.replace('/');
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {/* Step indicator */}
      <View style={styles.stepsRow}>
        {STEPS.map((s, i) => (
          <View key={s} style={styles.stepItem}>
            <View style={[styles.stepDot, i === 2 && styles.stepDotActive]}>
              <Text style={i === 2 ? styles.stepNumber : styles.stepNumberInactive}>{i + 1}</Text>
            </View>
            <Text style={[styles.stepLabel, i === 2 && styles.stepLabelActive]}>{s}</Text>
          </View>
        ))}
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>{t('invest.payment.amountLabel')}</Text>
            <Text style={styles.amountValue}>{formatMRU(amount)}</Text>
          </View>

          {step === 'instructions' && (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>{t('invest.payment.instructionsTitle')}</Text>
              <InstructionStep num={1} text={t('invest.payment.instructionsStep1')} />
              <InstructionStep num={2} text={t('invest.payment.instructionsStep2', { code: BANKILY_MERCHANT_CODE })} />
              <InstructionStep num={3} text={t('invest.payment.instructionsStep3')} />
              <InstructionStep num={4} text={t('invest.payment.instructionsStep4')} />
              <Button
                label={t('invest.payment.haveCode')}
                onPress={() => setStep('form')}
                style={{ marginTop: 24, width: '100%' }}
              />
            </View>
          )}

          {step === 'form' && (
            <View style={styles.stateBlock}>
              <Text style={styles.stateTitle}>{t('invest.payment.formTitle')}</Text>
              <Input
                label={t('invest.payment.phoneLabel')}
                prefix={PHONE_PREFIX}
                value={phoneDigits}
                onChangeText={(v) => { setFieldErrors((e) => ({ ...e, phone: undefined })); setPhoneDigits(v.replace(/[^0-9]/g, '')); }}
                error={fieldErrors.phone}
                keyboardType="number-pad"
                maxLength={8}
                containerStyle={styles.fullWidth}
              />
              <Input
                label={t('invest.payment.passcodeLabel')}
                placeholder={t('invest.payment.passcodePlaceholder')}
                value={passcode}
                onChangeText={(v) => { setFieldErrors((e) => ({ ...e, passcode: undefined })); setPasscode(v.replace(/[^0-9]/g, '')); }}
                error={fieldErrors.passcode}
                keyboardType="number-pad"
                maxLength={6}
                secureTextEntry
                containerStyle={styles.passcodeInput}
              />
              <Button
                label={t('invest.payment.submit')}
                onPress={handleSubmitPayment}
                loading={submitting}
                style={{ marginTop: 24, width: '100%' }}
              />
              <Button
                label={t('invest.payment.back')}
                onPress={() => setStep('instructions')}
                variant="ghost"
                style={{ marginTop: 4, width: '100%' }}
              />
            </View>
          )}

          {step === 'processing' && (
            <View style={styles.stateBlock}>
              <Animated.View style={[styles.bankiLyCircle, { transform: [{ scale: pulseAnim }] }]}>
                <Text style={styles.bankiLyLetter}>B</Text>
              </Animated.View>
              <Text style={styles.stateTitle}>{t('invest.payment.processing')}</Text>
              <Text style={styles.stateSubtitle}>{t('invest.payment.verifying')}</Text>
              <View style={styles.countdownRow}>
                <ActivityIndicator color={COLORS.primary} size="small" />
              </View>
            </View>
          )}

          {step === 'success' && (
            <View style={styles.stateBlock}>
              <View style={styles.successCircle}>
                <Text style={styles.successIcon}>✓</Text>
              </View>
              <Text style={styles.stateTitle}>{t('invest.payment.success')}</Text>
              <Text style={styles.stateSubtitle}>{t('invest.payment.redirecting')}</Text>
            </View>
          )}

          {step === 'pending' && (
            <View style={styles.stateBlock}>
              <View style={styles.pendingCircle}>
                <ActivityIndicator color="#fff" />
              </View>
              <Text style={styles.stateTitle}>{t('invest.payment.pendingTitle')}</Text>
              <Text style={styles.stateSubtitle}>{t('invest.payment.pendingMessage')}</Text>
              <Button
                label={t('invest.payment.viewPortfolio')}
                onPress={() => router.replace('/dashboard')}
                style={{ marginTop: 24, width: 240 }}
              />
              <Button label={t('invest.payment.cancel')} onPress={handleCancel} variant="ghost" style={{ marginTop: 8 }} />
            </View>
          )}

          {step === 'failed' && (
            <View style={styles.stateBlock}>
              <View style={styles.failedCircle}>
                <Text style={styles.failedIcon}>✕</Text>
              </View>
              <Text style={styles.stateTitle}>{t('invest.payment.failed')}</Text>
              <Text style={[styles.stateSubtitle, { color: COLORS.danger }]}>{errorMessage}</Text>
              {!terminal && (
                <Button label={t('invest.payment.retry')} onPress={handleRetry} style={{ marginTop: 24, width: 200 }} />
              )}
              <Button label={t('invest.payment.cancel')} onPress={handleCancel} variant="ghost" style={{ marginTop: 8 }} />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function InstructionStep({ num, text }: { num: number; text: string }) {
  return (
    <View style={styles.instructionRow}>
      <View style={styles.instructionDot}>
        <Text style={styles.instructionDotText}>{num}</Text>
      </View>
      <Text style={styles.instructionText}>{text}</Text>
    </View>
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
  body: { flexGrow: 1, alignItems: 'center', padding: 32 },
  amountCard: {
    backgroundColor: COLORS.surface, borderRadius: 16,
    paddingVertical: 20, paddingHorizontal: 32, alignItems: 'center',
    marginBottom: 32, width: '100%',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2,
  },
  amountLabel: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 4 },
  amountValue: { fontSize: 28, fontWeight: '800', color: COLORS.primary },
  fullWidth: { width: '100%' },
  passcodeInput: { width: '100%', marginTop: 12 },
  stateBlock: { alignItems: 'center', width: '100%' },
  bankiLyCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginBottom: 24,
    shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6,
  },
  bankiLyLetter: { fontSize: 36, fontWeight: '900', color: '#fff' },
  stateTitle: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 12, textAlign: 'center' },
  stateSubtitle: { fontSize: 14, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 8 },
  countdownRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    marginTop: 20, backgroundColor: COLORS.background,
    paddingHorizontal: 20, paddingVertical: 12, borderRadius: 24,
  },
  successCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.success,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  successIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  pendingCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.warning,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  failedCircle: {
    width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.danger,
    justifyContent: 'center', alignItems: 'center', marginBottom: 20,
  },
  failedIcon: { fontSize: 36, color: '#fff', fontWeight: '700' },
  instructionRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    width: '100%', marginBottom: 16,
  },
  instructionDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: COLORS.primary,
    justifyContent: 'center', alignItems: 'center', marginTop: 2, flexShrink: 0,
  },
  instructionDotText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  instructionText: { flex: 1, fontSize: 14, color: COLORS.textPrimary, lineHeight: 20 },
});
