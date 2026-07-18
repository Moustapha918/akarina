import { View, Text } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { COLORS } from '../../../../src/constants';

export default function InvestAmountScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background }}>
      <Text style={{ color: COLORS.primary, fontSize: 18 }}>Montant — Projet {id} — Phase 4</Text>
    </View>
  );
}
