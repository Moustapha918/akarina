import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS, PHONE_PREFIX } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { verifyOtp } from '../../src/services/authService';
import { getUser } from '../../src/services/userService';
import { useAuthStore } from '../../src/hooks/useAuthStore';

const RESEND_DELAY = 60;

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { phone, prefix: prefixParam } = useLocalSearchParams<{ phone: string; prefix: string }>();
  const prefix = prefixParam ?? PHONE_PREFIX;
  const { setUser } = useAuthStore();

  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [countdown, setCountdown] = useState(RESEND_DELAY);

  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  async function handleVerify() {
    if (code.length !== 6) return;
    setLoading(true);
    try {
      const uid = await verifyOtp(code);
      const user = await getUser(uid);

      if (user) {
        setUser(user);
        router.replace('/(app)');
      } else {
        router.push({ pathname: '/(auth)/register', params: { phone: `${prefix}${phone}` } });
      }
    } catch (e: any) {
      console.error('OTP verify error:', e?.code, e?.message, e);
      const message = e?.code ? `${e.code}\n${e.message ?? ''}` : t('auth.verify.invalidCode');
      Alert.alert(t('common.error'), message);
      setCode('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { paddingTop: insets.top + 16 }]}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>{t('common.back')}</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{t('auth.verify.title')}</Text>
          <Text style={styles.subtitle}>
            {t('auth.verify.codeSentTo')}
            <Text style={styles.phone}>{prefix} {phone}</Text>
          </Text>
        </View>

        {/* OTP */}
        <OtpInput value={code} onChange={setCode} />

        {/* Confirm */}
        <Button
          label={t('auth.verify.confirm')}
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.button}
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdown}>
              {t('auth.verify.resendIn', { count: countdown })}
            </Text>
          ) : (
            <TouchableOpacity onPress={() => router.back()}>
              <Text style={styles.resend}>{t('auth.verify.resend')}</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  back: {
    marginBottom: 32,
  },
  backText: {
    fontSize: 16,
    color: COLORS.primary,
    fontWeight: '500',
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  phone: {
    color: COLORS.primary,
    fontWeight: '700',
  },
  button: {
    marginTop: 32,
  },
  resendRow: {
    marginTop: 20,
    alignItems: 'center',
  },
  countdown: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  resend: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
