import { View, Text } from 'react-native';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { COLORS } from '../../../src/constants';

export default function DashboardScreen() {
  return (
    <GuestGuard
      icon="📊"
      title="Votre portfolio"
      description="Connectez-vous pour suivre vos investissements et l'évolution de vos projets."
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>Portfolio — Phase 7</Text>
      </View>
    </GuestGuard>
  );
}
