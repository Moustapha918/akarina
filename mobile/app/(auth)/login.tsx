import { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { COLORS, MAURITANIAN_PHONE_REGEX, PHONE_PREFIX } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { sendOtp } from '../../src/services/authService';
import app from '../../src/services/firebase';

// FirebaseRecaptchaVerifierModal est natif uniquement (iOS/Android)
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';
let FirebaseRecaptchaVerifierModal: any = null;
if (isNative) {
  FirebaseRecaptchaVerifierModal = require('expo-firebase-recaptcha').FirebaseRecaptchaVerifierModal;
}

export default function LoginScreen() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const recaptchaVerifier = useRef<any>(null);

  // Sur web : afficher un message d'indisponibilité
  if (!isNative) {
    return (
      <View style={styles.webContainer}>
        <Text style={styles.logo}>أكارينا</Text>
        <Text style={styles.logoLatin}>Akarina</Text>
        <View style={styles.webCard}>
          <Text style={styles.webEmoji}>📱</Text>
          <Text style={styles.webTitle}>Application mobile</Text>
          <Text style={styles.webMessage}>
            La connexion par SMS est disponible uniquement sur l'application mobile.{'\n\n'}
            Téléchargez Akarina sur iOS ou Android pour investir.
          </Text>
        </View>
      </View>
    );
  }

  function validate(): boolean {
    const full = `${PHONE_PREFIX}${phone}`;
    if (!MAURITANIAN_PHONE_REGEX.test(full)) {
      setError('Numéro invalide. Ex: 22 00 00 00');
      return false;
    }
    setError('');
    return true;
  }

  async function handleSendOtp() {
    if (!validate()) return;
    setLoading(true);
    try {
      await sendOtp(phone, recaptchaVerifier.current!);
      router.push({ pathname: '/(auth)/verify', params: { phone } });
    } catch (e: any) {
      Alert.alert('Erreur', e.message ?? "Impossible d'envoyer le code. Réessayez.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <FirebaseRecaptchaVerifierModal
        ref={recaptchaVerifier}
        firebaseConfig={app.options}
        attemptInvisibleVerification={true}
      />

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>أكارينا</Text>
          <Text style={styles.logoLatin}>Akarina</Text>
          <Text style={styles.tagline}>Investissez dans l'immobilier mauritanien</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.title}>Connexion</Text>
          <Text style={styles.subtitle}>
            Entrez votre numéro de téléphone mauritanien pour recevoir un code de vérification.
          </Text>

          <Input
            label="Numéro de téléphone"
            prefix="+222"
            placeholder="XX XX XX XX"
            value={phone}
            onChangeText={(t) => {
              setError('');
              setPhone(t.replace(/\D/g, '').slice(0, 8));
            }}
            keyboardType="phone-pad"
            error={error}
            containerStyle={styles.inputContainer}
            autoFocus
          />

          <Button
            label="Recevoir le code"
            onPress={handleSendOtp}
            loading={loading}
            disabled={phone.length < 8}
            style={styles.button}
          />
        </View>

        <Text style={styles.legal}>
          En continuant, vous acceptez nos{' '}
          <Text style={styles.link}>Conditions d'utilisation</Text> et notre{' '}
          <Text style={styles.link}>Politique de confidentialité</Text>.
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
    paddingTop: 80,
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
  // Web uniquement
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
