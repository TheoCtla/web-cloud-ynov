import { router } from 'expo-router';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InscriptionPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const validate = () => {
    if (!EMAIL_REGEX.test(email)) return 'Email invalide';
    if (password.length < 6) return 'Le mot de passe doit faire au moins 6 caractères';
    if (password !== confirmPassword) return 'Les mots de passe ne correspondent pas';
    return '';
  };

  const handleSignup = () => {
    const err = validate();
    if (err) {
      setError(err);
      Toast.show({ type: 'error', text1: 'Validation', text2: err });
      return;
    }
    setError('');
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        const user = userCredential.user;
        Toast.show({ type: 'success', text1: 'Compte créé', text2: user.email ?? '' });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur inscription', text2: msg });
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Inscription</Text>
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
      <TextInput
        style={styles.input}
        placeholder="Confirmer le mot de passe"
        value={confirmPassword}
        onChangeText={setConfirmPassword}
        secureTextEntry
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Pressable style={styles.button} onPress={handleSignup}>
        <Text style={styles.buttonText}>S&apos;inscrire</Text>
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
});
