import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../../../src/constants';
import { Button } from '../../../../src/components/ui/Button';
import { cancelInvestment } from '../../../../src/services/investmentService';

type PaymentMethod = 'bankily' | 'masrivi';

export default function InvestMethodScreen() {
  const { id, investmentId, amount } = useLocalSearchParams<{
    id: string; investmentId: string; amount: string;
  }>();
  const router = useRouter();
  const { t } = useTranslation();

  const STEPS = [
    t('invest.steps.amount'),
    t('invest.steps.contract'),
    t('invest.steps.method'),
    t('invest.steps.payment'),
    t('invest.steps.confirmation'),
  ];

  const [selected, setSelected] = useState<PaymentMethod>('bankily');
  const [cancelling, setCancelling] = useState(false);

  function handleContinue() {
    router.push(`/invest/${id}/payment?investmentId=${investmentId}&amount=${amount}`);
  }

  function handleCancel() {
    Alert.alert(
      t('invest.cancel.confirmTitle'),
      t('invest.cancel.confirmMessage'),
      [
        { text: t('invest.cancel.confirmDismiss'), style: 'cancel' },
        {
          text: t('invest.cancel.confirmConfirm'),
          style: 'destructive',
          onPress: async () => {
            setCancelling(true);
            try {
              await cancelInvestment(investmentId);
              router.replace('/');
            } catch (err) {
              console.error('[Method] cancelInvestment a échoué:', err);
              Alert.alert(t('common.error'), t('invest.cancel.error'));
              setCancelling(false);
            }
          },
        },
      ]
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <View style={styles.topBar}>
        <Button
          label={t('invest.cancel.button')}
          onPress={handleCancel}
          loading={cancelling}
          variant="outline"
          style={styles.cancelButton}
          textStyle={styles.cancelButtonText}
        />
      </View>

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

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.title}>{t('invest.method.title')}</Text>
        <Text style={styles.subtitle}>{t('invest.method.subtitle')}</Text>

        <TouchableOpacity
          style={[styles.optionCard, selected === 'bankily' && styles.optionCardActive]}
          onPress={() => setSelected('bankily')}
          activeOpacity={0.8}
        >
          <View style={styles.optionLogoBox}>
            <Image
              source={require('../../../../assets/logo-Bankily.png')}
              style={styles.optionLogo}
              resizeMode="contain"
            />
          </View>
          <View style={styles.optionTextBlock}>
            <Text style={styles.optionTitle}>{t('invest.method.bankilyTitle')}</Text>
            <Text style={styles.optionSubtitle}>{t('invest.method.bankilySubtitle')}</Text>
          </View>
          <View style={[styles.radio, selected === 'bankily' && styles.radioActive]}>
            {selected === 'bankily' && <View style={styles.radioDot} />}
          </View>
        </TouchableOpacity>

        <View style={[styles.optionCard, styles.optionCardDisabled]}>
          <View style={[styles.optionIcon, { backgroundColor: COLORS.disabled }]}>
            <Text style={styles.optionIconText}>M</Text>
          </View>
          <View style={styles.optionTextBlock}>
            <Text style={[styles.optionTitle, styles.optionTitleDisabled]}>{t('invest.method.masriviTitle')}</Text>
            <Text style={styles.optionSubtitle}>{t('invest.method.masriviSubtitle')}</Text>
          </View>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>{t('invest.method.comingSoon')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button label={t('invest.method.continueBtn')} onPress={handleContinue} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  topBar: {
    paddingHorizontal: 12,
    paddingTop: 6,
    backgroundColor: COLORS.surface,
  },
  cancelButton: { height: 36, paddingHorizontal: 12, alignSelf: 'flex-start', borderColor: COLORS.danger },
  cancelButtonText: { fontSize: 13, color: COLORS.danger },
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
  body: { flexGrow: 1, padding: 24 },
  title: { fontSize: 20, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 6 },
  subtitle: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 24, lineHeight: 20 },
  optionCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: COLORS.surface, borderRadius: 16, padding: 16,
    borderWidth: 2, borderColor: COLORS.border, marginBottom: 16,
  },
  optionCardActive: { borderColor: COLORS.primary },
  optionCardDisabled: { opacity: 0.6 },
  optionIcon: {
    width: 48, height: 48, borderRadius: 24,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  optionIconText: { fontSize: 20, fontWeight: '900', color: '#fff' },
  optionLogoBox: {
    width: 64, height: 42,
    justifyContent: 'center', alignItems: 'center', marginRight: 14,
  },
  optionLogo: { width: '100%', height: '100%' },
  optionTextBlock: { flex: 1 },
  optionTitle: { fontSize: 16, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 2 },
  optionTitleDisabled: { color: COLORS.textSecondary },
  optionSubtitle: { fontSize: 12, color: COLORS.textSecondary },
  radio: {
    width: 22, height: 22, borderRadius: 11,
    borderWidth: 2, borderColor: COLORS.border,
    justifyContent: 'center', alignItems: 'center',
  },
  radioActive: { borderColor: COLORS.primary },
  radioDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.primary },
  comingSoonBadge: {
    backgroundColor: COLORS.background, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  comingSoonText: { fontSize: 11, fontWeight: '600', color: COLORS.textSecondary },
  footer: {
    padding: 20, backgroundColor: COLORS.surface,
    borderTopWidth: 1, borderTopColor: COLORS.border,
  },
});
