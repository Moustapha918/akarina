import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { auth } from '../../src/services/firebase';
import { COLORS } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { createUserProfile } from '../../src/services/userService';
import { useAuthStore } from '../../src/hooks/useAuthStore';

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useAuthStore();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  function validate(): boolean {
    const newErrors: { name?: string; email?: string } = {};
    if (name.trim().length < 3) newErrors.name = t('auth.register.nameTooShort');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('auth.register.invalidEmail');
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    const uid = auth.currentUser?.uid;
    if (!uid) {
      Alert.alert(t('auth.register.sessionExpired'), t('auth.register.sessionExpiredMsg'));
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      const user = await createUserProfile(uid, { name, email, phone });
      setUser(user);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.register.createError'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={[styles.container, { paddingTop: insets.top + 16 }]} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.emoji}>👋</Text>
          <Text style={styles.title}>{t('auth.register.title')}</Text>
          <Text style={styles.subtitle}>{t('auth.register.subtitle')}</Text>
        </View>

        {/* Phone (readonly) */}
        <View style={styles.phoneCard}>
          <Text style={styles.phoneLabel}>{t('auth.register.verifiedNumber')}</Text>
          <Text style={styles.phoneValue}>{phone}</Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('auth.register.fullName')}
            placeholder="Mohamed Ahmed"
            value={name}
            onChangeText={(text) => { setErrors((e) => ({ ...e, name: undefined })); setName(text); }}
            error={errors.name}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.register.email')}
            placeholder="exemple@email.com"
            value={email}
            onChangeText={(text) => { setErrors((e) => ({ ...e, email: undefined })); setEmail(text); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
            containerStyle={styles.inputGap}
          />
        </View>

        <Button
          label={t('auth.register.createAccount')}
          onPress={handleRegister}
          loading={loading}
          disabled={!name || !email}
          style={styles.button}
        />

        <Text style={styles.notice}>{t('auth.register.notice')}</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: COLORS.background },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 32,
  },
  emoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: COLORS.textPrimary,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  phoneCard: {
    backgroundColor: '#EBF5FB',
    borderRadius: 12,
    padding: 16,
    marginBottom: 28,
    borderStartWidth: 4,
    borderStartColor: COLORS.primary,
  },
  phoneLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  phoneValue: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.primary,
  },
  form: {
    gap: 16,
    marginBottom: 28,
  },
  inputGap: {
    marginTop: 4,
  },
  button: {},
  notice: {
    marginTop: 16,
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
