import { Stack } from 'expo-router';

/**
 * Pile englobant les onglets (tabs) et les écrans de flux (détail projet,
 * tunnel d'investissement). Ces derniers ne doivent PAS être des Tabs.Screen :
 * un navigateur par onglets ne démonte jamais ses écrans en changeant d'onglet,
 * ce qui faisait qu'une seule instance de chaque écran du tunnel survivait pour
 * toute la session — le state (ex. le bouton "Signer" en loading) restait alors
 * pollué d'un parcours d'investissement à l'autre. En pile, chaque navigation
 * crée une instance fraîche et démonte la précédente.
 */
export default function AppLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="project/[id]" />
      <Stack.Screen name="invest/[id]/amount" />
      <Stack.Screen name="invest/[id]/contract" />
      <Stack.Screen name="invest/[id]/payment" />
      <Stack.Screen name="invest/[id]/confirmation" />
    </Stack>
  );
}
