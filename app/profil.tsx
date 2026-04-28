import { router } from 'expo-router';
import { signOut } from 'firebase/auth';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

export default function ProfilPage() {
  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Déconnecté' });
        router.replace('/connexion');
      })
      .catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Erreur déconnexion',
          text2: firebaseErrorMessage(error),
        });
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Profil</Text>
      <Text style={styles.subtitle}>Ici s&apos;affichera prochainement votre profil</Text>
      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  button: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
