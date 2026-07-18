import { Modal, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS } from '../../constants';
import { Button } from './Button';

interface AuthPromptModalProps {
  visible: boolean;
  onClose: () => void;
  message?: string;
}

export function AuthPromptModal({
  visible,
  onClose,
  message = 'Créez un compte gratuitement pour investir dans ce projet.',
}: AuthPromptModalProps) {
  const insets = useSafeAreaInsets();

  function handleLogin() {
    onClose();
    router.push('/(auth)/login');
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      {/* Backdrop */}
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />

      {/* Sheet */}
      <View style={[styles.sheet, { paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.handle} />

        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>Rejoignez Akarina</Text>
        <Text style={styles.message}>{message}</Text>

        <View style={styles.benefitsList}>
          {[
            '✓  Contrat Mousharaka sécurisé',
            '✓  Paiement rapide via Bankily',
            '✓  Suivi du chantier en temps réel',
          ].map((benefit) => (
            <Text key={benefit} style={styles.benefit}>{benefit}</Text>
          ))}
        </View>

        <Button label="Créer un compte" onPress={handleLogin} style={styles.button} />
        <Button
          label="J'ai déjà un compte"
          onPress={handleLogin}
          variant="ghost"
          style={styles.buttonGhost}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 28,
    paddingTop: 12,
    gap: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 40,
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: COLORS.textPrimary,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  benefitsList: {
    backgroundColor: '#F2F3F4',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    marginVertical: 4,
  },
  benefit: {
    fontSize: 14,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  button: {},
  buttonGhost: {},
});
