import { View, Text, StyleSheet, TouchableOpacity, Image, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { COLORS } from '../../constants';

async function pickFromLibrary(t: (key: string) => string): Promise<string | null> {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(t('common.permissionDenied'), t('common.galleryPermission'));
    return null;
  }
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

async function takePhoto(t: (key: string) => string): Promise<string | null> {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(t('common.permissionDenied'), t('common.cameraPermission'));
    return null;
  }
  const result = await ImagePicker.launchCameraAsync({
    quality: 0.8,
    allowsEditing: true,
    aspect: [1, 1],
  });
  if (result.canceled) return null;
  return result.assets[0].uri;
}

interface AvatarPickerProps {
  uri: string | null;
  onPick: (uri: string) => void;
  hint?: string;
}

/**
 * Sélecteur de photo de profil circulaire — utilisé à l'inscription.
 */
export function AvatarPicker({ uri, onPick, hint }: AvatarPickerProps) {
  const { t } = useTranslation();

  function handlePress() {
    Alert.alert(t('common.addPhoto'), '', [
      {
        text: t('common.takePhoto'),
        onPress: async () => {
          const u = await takePhoto(t);
          if (u) onPick(u);
        },
      },
      {
        text: t('common.pickGallery'),
        onPress: async () => {
          const u = await pickFromLibrary(t);
          if (u) onPick(u);
        },
      },
      { text: t('common.cancel'), style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.circle} onPress={handlePress} activeOpacity={0.8}>
        {uri ? (
          <Image source={{ uri }} style={styles.image} resizeMode="cover" />
        ) : (
          <Text style={styles.icon}>📷</Text>
        )}
        <View style={styles.editBadge}>
          <Text style={styles.editBadgeText}>{uri ? '✏' : '+'}</Text>
        </View>
      </TouchableOpacity>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', gap: 8 },
  circle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: { width: '100%', height: '100%' },
  icon: { fontSize: 28 },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    end: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.surface,
  },
  editBadgeText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  hint: { fontSize: 12, color: COLORS.textSecondary, textAlign: 'center' },
});
