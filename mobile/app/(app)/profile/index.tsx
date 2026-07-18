import { View, Text } from 'react-native';
import { GuestGuard } from '../../../src/components/ui/GuestGuard';
import { COLORS } from '../../../src/constants';

export default function ProfileScreen() {
  return (
    <GuestGuard
      icon="👤"
      title="Votre profil"
      description="Connectez-vous pour accéder à votre profil et gérer vos informations."
    >
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
        <Text style={{ color: COLORS.primary, fontSize: 18 }}>Profil</Text>
      </View>
    </GuestGuard>
  );
}
