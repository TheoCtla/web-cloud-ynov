import { Link, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';
import Toast from 'react-native-toast-message';

export default function RootLayout() {
  return (
    <View style={styles.container}>
      <View style={styles.navbar}>
        <Link href="/" style={styles.link}>Accueil</Link>
        <Link href="/connexion" style={styles.link}>Connexion</Link>
        <Link href="/inscription" style={styles.link}>Inscription</Link>
        <Link href="/connexion-tel" style={styles.link}>Connexion tél.</Link>
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
