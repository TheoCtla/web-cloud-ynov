import { router } from 'expo-router';
import {
  ConfirmationResult,
  RecaptchaVerifier,
  signInWithPhoneNumber,
} from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

export default function ConnexionTelPage() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
    });
    recaptchaRef.current.render();
  }, []);

  const handleSendCode = () => {
    if (!phone.trim().startsWith('+')) {
      const err = 'Numéro au format international requis (ex: +33612345678)';
      setError(err);
      Toast.show({ type: 'error', text1: 'Validation', text2: err });
      return;
    }
    if (!recaptchaRef.current) {
      Toast.show({ type: 'error', text1: 'reCAPTCHA non initialisé' });
      return;
    }
    setError('');
    signInWithPhoneNumber(auth, phone, recaptchaRef.current)
      .then((result) => {
        setConfirmation(result);
        Toast.show({ type: 'success', text1: 'Code envoyé par SMS' });
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur envoi SMS', text2: msg });
      });
  };

  const handleVerifyCode = () => {
    if (!confirmation) return;
    if (code.length < 6) {
      setError('Code à 6 chiffres');
      return;
    }
    setError('');
    confirmation
      .confirm(code)
      .then((userCredential) => {
        Toast.show({
          type: 'success',
          text1: 'Connecté',
          text2: userCredential.user.phoneNumber ?? '',
        });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Code invalide', text2: msg });
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Connexion par téléphone</Text>
      {!confirmation ? (
        <>
          <TextInput
            style={styles.input}
            placeholder="+33612345678"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
            autoCapitalize="none"
          />
          <View nativeID="recaptcha-container" />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={handleSendCode}>
            <Text style={styles.buttonText}>Envoyer le code</Text>
          </Pressable>
        </>
      ) : (
        <>
          <TextInput
            style={styles.input}
            placeholder="Code reçu par SMS"
            value={code}
            onChangeText={setCode}
            keyboardType="number-pad"
            maxLength={6}
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Pressable style={styles.button} onPress={handleVerifyCode}>
            <Text style={styles.buttonText}>Valider le code</Text>
          </Pressable>
        </>
      )}
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
