import { FontAwesome } from '@expo/vector-icons';
import { Image, StyleSheet, View } from 'react-native';

type AvatarProps = {
  // URL de la photo de profil ; null/undefined => icône par défaut
  uri: string | null | undefined;
  size?: number;
};

// Photo de profil ronde, avec une icône de repli si aucune photo.
export default function Avatar({ uri, size = 32 }: AvatarProps) {
  const dimension = { width: size, height: size, borderRadius: size / 2 };

  if (uri) {
    return <Image source={{ uri }} style={[styles.image, dimension]} />;
  }
  return (
    <View style={[styles.placeholder, dimension]}>
      <FontAwesome name="user" size={size * 0.55} color="#9ca3af" />
    </View>
  );
}

const styles = StyleSheet.create({
  image: { backgroundColor: '#e5e7eb' },
  placeholder: {
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
