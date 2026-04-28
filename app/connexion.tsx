import { router } from 'expo-router';
import {
  FacebookAuthProvider,
  GithubAuthProvider,
  signInAnonymously,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

export default function ConnexionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!email.trim()) return 'Email requis';
    if (!password) return 'Mot de passe requis';
    return '';
  };

  const handleLogin = () => {
    const err = validate();
    if (err) {
      setError(err);
      Toast.show({ type: 'error', text1: 'Validation', text2: err });
      return;
    }
    setError('');
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        Toast.show({ type: 'success', text1: 'Connecté', text2: user.email ?? '' });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur connexion', text2: msg });
      });
  };

  const handleGithubLogin = () => {
    const provider = new GithubAuthProvider();
    setError('');
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = GithubAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        console.log('GitHub token:', token);
        Toast.show({
          type: 'success',
          text1: 'Connecté via GitHub',
          text2: user.email ?? user.displayName ?? '',
        });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur GitHub', text2: msg });
      });
  };

  const handleFacebookLogin = () => {
    const provider = new FacebookAuthProvider();
    setError('');
    signInWithPopup(auth, provider)
      .then((result) => {
        const credential = FacebookAuthProvider.credentialFromResult(result);
        const token = credential?.accessToken;
        const user = result.user;
        console.log('Facebook token:', token);
        Toast.show({
          type: 'success',
          text1: 'Connecté via Facebook',
          text2: user.email ?? user.displayName ?? '',
        });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur Facebook', text2: msg });
      });
  };

  const handleAnonymousLogin = () => {
    setError('');
    signInAnonymously(auth)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Connecté en anonyme' });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur connexion anonyme', text2: msg });
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion</Text>
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Mot de passe"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Se connecter</Text>
      </Pressable>

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>ou</Text>
        <View style={styles.line} />
      </View>

      <Pressable style={styles.githubButton} onPress={handleGithubLogin}>
        <Text style={styles.buttonText}>Se connecter avec GitHub</Text>
      </Pressable>

      <Pressable style={styles.facebookButton} onPress={handleFacebookLogin}>
        <Text style={styles.buttonText}>Se connecter avec Facebook</Text>
      </Pressable>

      <Pressable style={styles.anonymousButton} onPress={handleAnonymousLogin}>
        <Text style={styles.buttonText}>Connexion anonyme</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  error: { color: '#dc2626', fontSize: 14 },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  separatorText: { color: '#6b7280', fontSize: 14 },
  githubButton: {
    backgroundColor: '#24292e',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  facebookButton: {
    backgroundColor: '#1877f2',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  anonymousButton: {
    backgroundColor: '#6b7280',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
});
