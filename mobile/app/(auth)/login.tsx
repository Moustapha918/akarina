import { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { FirebaseRecaptchaVerifierModal } from 'expo-firebase-recaptcha';
import { COLORS, COUNTRIES, Country } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { sendOtp } from '../../src/services/authService';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const recaptchaVerifier = useRef<FirebaseRecaptchaVerifierModal>(null);
  const [country, setCountry] = useState<Country>(COUNTRIES[0]);
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  function handleCountryPick() {
    Alert.alert(
      t('auth.login.selectCountry'),
      undefined,
      [
        ...COUNTRIES.map((c) => ({
          text: `${c.flag}  ${c.name}  (${c.prefix})`,
          onPress: () => { setCountry(c); setPhone(''); setError(''); },
        })),
        { text: t('common.cancel'), style: 'cancel' as const },
      ]
    );
  }

  function validate(): boolean {
    const full = `${country.prefix}${phone}`;
    if (!country.regex.test(full)) {
      setError(t('auth.login.invalidNumber', { placeholder: country.placeholder }));
      return false;
    }
    setError('');
    return true;
  }

  async function handleSendOtp() {
    if (!validate()) return;
    setLoading(true);
    try {
      const isBypass = await sendOtp(phone, recaptchaVerifier.current, country.prefix);
      router.push({ pathname: '/(auth)/verify', params: { phone, bypass: isBypass ? '1' : '0', prefix: country.prefix } });
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.login.sendError'));
    } finally {
      setLoading(false);
    }
  }

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.logo}>أكارينا</Text>
        <Text style={styles.logoLatin}>Akarina</Text>
        <View style={styles.webCard}>
          <Text style={styles.webEmoji}>📱</Text>
          <Text style={styles.webTitle}>{t('auth.login.webTitle')}</Text>
          <Text style={styles.webMessage}>{t('auth.login.webMessage')}</Text>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={firebaseConfig}
        attemptInvisibleVerification
      />
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 20 }]} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>أكارينا</Text>
          <Text style={styles.logoLatin}>Akarina</Text>
          <Text style={styles.tagline}>{t('auth.login.tagline')}</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>{t('auth.login.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.login.subtitle')}</Text>

          <Input
            label={t('auth.login.phoneLabel')}
            prefixElement={
              <TouchableOpacity style={styles.countryPicker} onPress={handleCountryPick}>
                <Text style={styles.countryFlag}>{country.flag}</Text>
                <Text style={styles.countryPrefix}>{country.prefix}</Text>
                <Text style={styles.countryChevron}>▾</Text>
              </TouchableOpacity>
            }
            placeholder={country.placeholder}
            value={phone}
            onChangeText={(text) => {
              setError('');
              setPhone(text.replace(/\D/g, '').slice(0, country.digitCount));
            }}
            keyboardType="phone-pad"
            error={error}
            containerStyle={styles.inputContainer}
            autoFocus
          />

          <Button
            label={t('auth.login.sendCode')}
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < country.digitCount}
            style={styles.button}
          />
        </View>

        <Text style={styles.legal}>
          {t('auth.login.legal')}{' '}
          <Text style={styles.link}>{t('auth.login.terms')}</Text>{' '}
          {t('auth.login.and')}{' '}
          <Text style={styles.link}>{t('auth.login.privacy')}</Text>.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.primary },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    fontSize: 40,
    color: COLORS.secondary,
    fontWeight: '700',
  },
  logoLatin: {
    fontSize: 22,
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 4,
    marginTop: 4,
  },
  tagline: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    marginTop: 8,
    textAlign: 'center',
  },
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 20,
  },
  button: {
    marginTop: 4,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingRight: 10,
    borderRightWidth: 1.5,
    borderRightColor: COLORS.border,
    marginRight: 8,
  },
  countryFlag: { fontSize: 18 },
  countryPrefix: { fontSize: 15, fontWeight: '600', color: COLORS.textPrimary },
  countryChevron: { fontSize: 10, color: COLORS.textSecondary },
  legal: {
    marginTop: 24,
    fontSize: 12,
    color: 'rgba(255,255,255,0.6)',
    textAlign: 'center',
    lineHeight: 18,
  },
  link: {
    color: COLORS.secondary,
    textDecorationLine: 'underline',
  },
  webContainer: {
    flex: 1,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  webCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginTop: 32,
    maxWidth: 400,
    width: '100%',
  },
  webEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  webTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 12,
    textAlign: 'center',
  },
  webMessage: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
});
