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
import auth from '@react-native-firebase/auth';
import { COLORS } from '../../src/constants';
import { Button } from '../../src/components/ui/Button';
import { Input } from '../../src/components/ui/Input';
import { DateInput } from '../../src/components/ui/DateInput';
import { AvatarPicker } from '../../src/components/ui/AvatarPicker';
import { createUserProfile } from '../../src/services/userService';
import { useAuthStore } from '../../src/hooks/useAuthStore';

const MIN_AGE = 18;

function maxBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - MIN_AGE);
  return d;
}

function minBirthDate(): Date {
  const d = new Date();
  d.setFullYear(d.getFullYear() - 100);
  return d;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  dateOfBirth?: string;
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { setUser } = useAuthStore();

  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  function validate(): boolean {
    const newErrors: FormErrors = {};
    if (firstName.trim().length < 2) newErrors.firstName = t('auth.register.firstNameTooShort');
    if (lastName.trim().length < 2) newErrors.lastName = t('auth.register.lastNameTooShort');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) newErrors.email = t('auth.register.invalidEmail');
    if (!dateOfBirth) {
      newErrors.dateOfBirth = t('auth.register.dateOfBirthRequired');
    } else if (dateOfBirth > maxBirthDate()) {
      newErrors.dateOfBirth = t('auth.register.dateOfBirthTooYoung', { minAge: MIN_AGE });
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleRegister() {
    if (!validate()) return;
    const uid = auth().currentUser?.uid;
    if (!uid) {
      Alert.alert(t('auth.register.sessionExpired'), t('auth.register.sessionExpiredMsg'));
      router.replace('/(auth)/login');
      return;
    }

    setLoading(true);
    try {
      const user = await createUserProfile(uid, {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth!,
        address: address.trim() || undefined,
        photoUri: photoUri ?? undefined,
      });
      setUser(user);
      router.replace('/(app)');
    } catch (e: any) {
      Alert.alert(t('common.error'), e.message ?? t('auth.register.createError'));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit = !!firstName && !!lastName && !!email && !!dateOfBirth;

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

        {/* Photo */}
        <View style={styles.avatarSection}>
          <AvatarPicker uri={photoUri} onPick={setPhotoUri} hint={t('auth.register.photoHint')} />
        </View>

        {/* Form */}
        <View style={styles.form}>
          <Input
            label={t('auth.register.firstName')}
            placeholder={t('auth.register.firstNamePlaceholder')}
            value={firstName}
            onChangeText={(text) => { setErrors((e) => ({ ...e, firstName: undefined })); setFirstName(text); }}
            error={errors.firstName}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.register.lastName')}
            placeholder={t('auth.register.lastNamePlaceholder')}
            value={lastName}
            onChangeText={(text) => { setErrors((e) => ({ ...e, lastName: undefined })); setLastName(text); }}
            error={errors.lastName}
            autoCapitalize="words"
          />
          <Input
            label={t('auth.register.email')}
            placeholder={t('auth.register.emailPlaceholder')}
            value={email}
            onChangeText={(text) => { setErrors((e) => ({ ...e, email: undefined })); setEmail(text); }}
            error={errors.email}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <DateInput
            label={t('auth.register.dateOfBirth')}
            placeholder={t('auth.register.dateOfBirthPlaceholder')}
            value={dateOfBirth}
            onChange={(date) => { setErrors((e) => ({ ...e, dateOfBirth: undefined })); setDateOfBirth(date); }}
            error={errors.dateOfBirth}
            maximumDate={maxBirthDate()}
            minimumDate={minBirthDate()}
          />
          <Input
            label={t('auth.register.addressOptional')}
            placeholder={t('auth.register.addressPlaceholder')}
            value={address}
            onChangeText={setAddress}
            autoCapitalize="sentences"
          />
        </View>

        <Button
          label={t('auth.register.createAccount')}
          onPress={handleRegister}
          loading={loading}
          disabled={!canSubmit}
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
    marginBottom: 24,
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
  avatarSection: {
    marginBottom: 24,
  },
  form: {
    gap: 16,
    marginBottom: 28,
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
