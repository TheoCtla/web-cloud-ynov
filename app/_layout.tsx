import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { onAuthStateChanged } from 'firebase/auth';
import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { registerForPushNotifications } from '../utils/notifications';

export default function RootLayout() {
  // À la connexion d'un utilisateur, on enregistre le token de
  // notification push de son appareil dans Firestore.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        registerForPushNotifications(user.uid);
      }
    });
    return unsubscribe;
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Link href="/" style={styles.link}>Accueil</Link>
        <Link href="/connexion" style={styles.link}>Connexion</Link>
        <Link href="/inscription" style={styles.link}>Inscription</Link>
        <Link href="/profil" style={styles.link}>Profil</Link>
      </View>
      <Stack screenOptions={{ headerShown: false }} />
      <StatusBar style="auto" />
      <Toast />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  navbar: {
    flexDirection: 'row',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 24,
    backgroundColor: '#f3f4f6',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  link: { fontSize: 16, color: '#2563eb', fontWeight: '500' },
});
