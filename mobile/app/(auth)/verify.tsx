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
import { COLORS, PHONE_PREFIX, DEV_TEST_PHONES } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { OtpInput } from '../../src/components/ui/OtpInput';
import { verifyOtp } from '../../src/services/authService';
import { getUser } from '../../src/services/userService';
import { useAuthStore } from '../../src/hooks/useAuthStore';

const RESEND_DELAY = 60;

export default function VerifyScreen() {
  const { phone, bypass } = useLocalSearchParams<{ phone: string; bypass: string }>();
  const { setUser } = useAuthStore();

  const isDevBypass = __DEV__ && bypass === '1';
  const devOtp = isDevBypass ? DEV_TEST_PHONES[`${PHONE_PREFIX}${phone}`] : undefined;

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
        // Utilisateur existant → accueil
        setUser(user);
        router.replace('/(app)');
      } else {
        // Nouvel utilisateur → compléter le profil
        router.push({ pathname: '/(auth)/register', params: { phone: `${PHONE_PREFIX}${phone}` } });
      }
    } catch (e: any) {
      const message = __DEV__
        ? (e?.message ?? String(e))
        : 'Le code saisi est invalide ou expiré. Réessayez.';
      Alert.alert('Erreur', message);
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
      <View style={styles.container}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={styles.back}>
          <Text style={styles.backText}>← Retour</Text>
        </TouchableOpacity>

        {/* Bannière dev bypass */}
        {isDevBypass && (
          <TouchableOpacity
            style={styles.devBanner}
            onPress={() => setCode(devOtp ?? '')}
            activeOpacity={0.8}
          >
            <Text style={styles.devBannerText}>
              🛠 Mode dev — OTP : <Text style={styles.devBannerCode}>{devOtp}</Text>
            </Text>
            <Text style={styles.devBannerHint}>Appuyer pour remplir automatiquement</Text>
          </TouchableOpacity>
        )}

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Vérification</Text>
          <Text style={styles.subtitle}>
            {isDevBypass
              ? 'Mode simulateur — aucun SMS envoyé.'
              : `Code envoyé au\n`}
            {!isDevBypass && <Text style={styles.phone}>{PHONE_PREFIX} {phone}</Text>}
          </Text>
        </View>

        {/* OTP */}
        <OtpInput value={code} onChange={setCode} />

        {/* Confirm */}
        <Button
          label="Confirmer"
          onPress={handleVerify}
          loading={loading}
          disabled={code.length !== 6}
          style={styles.button}
        />

        {/* Resend */}
        <View style={styles.resendRow}>
          {countdown > 0 ? (
            <Text style={styles.countdown}>
              Renvoyer dans <Text style={styles.countdownBold}>{countdown}s</Text>
            </Text>
          ) : (
            <TouchableOpacity onPress={() => { router.back(); }}>
              <Text style={styles.resend}>Renvoyer le code</Text>
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
    paddingTop: 60,
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
  countdownBold: {
    fontWeight: '700',
    color: COLORS.primary,
  },
  resend: {
    fontSize: 14,
    color: COLORS.primary,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  // Dev bypass
  devBanner: {
    backgroundColor: '#FFF3CD',
    borderWidth: 1,
    borderColor: '#FFEAA7',
    borderRadius: 10,
    padding: 12,
    marginBottom: 20,
  },
  devBannerText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  devBannerCode: {
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
    fontSize: 15,
    fontWeight: '700',
  },
  devBannerHint: {
    fontSize: 11,
    color: '#856404',
    marginTop: 4,
    opacity: 0.8,
  },
});
