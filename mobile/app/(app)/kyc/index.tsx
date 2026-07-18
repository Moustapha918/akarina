import { View, Text } from 'react-native';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { COLORS } from '../../../src/constants';

export default function KycScreen() {
  return (
    <GuestGuard
      icon="🪪"
      title="Vérification d'identité"
      description="Connectez-vous pour soumettre votre pièce d'identité et débloquer l'investissement complet."
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>KYC — Phase 6</Text>
      </View>
    </GuestGuard>
  );
}
