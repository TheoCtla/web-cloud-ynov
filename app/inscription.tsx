import { router } from 'expo-router';
import {
  ConfirmationResult,
  FacebookAuthProvider,
  GithubAuthProvider,
  RecaptchaVerifier,
  createUserWithEmailAndPassword,
  signInAnonymously,
  signInWithPhoneNumber,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { useEffect, useRef, useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function InscriptionPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [showPhoneForm, setShowPhoneForm] = useState(false);
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [confirmation, setConfirmation] = useState<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!showPhoneForm) return;
    if (typeof window === 'undefined') return;
    if (recaptchaRef.current) return;
    recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', {
      size: 'normal',
    });
    recaptchaRef.current.render();
  }, [showPhoneForm]);

  const validate = () => {
    if (!name.trim()) return 'Nom requis';
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
        return updateProfile(user, { displayName: name.trim() }).then(() => user);
      })
      .then((user) => {
        Toast.show({ type: 'success', text1: 'Compte créé', text2: user.email ?? '' });
        router.replace('/profil');
      })
      .catch((error) => {
        const msg = firebaseErrorMessage(error);
        setError(msg);
        Toast.show({ type: 'error', text1: 'Erreur inscription', text2: msg });
      });
  };

  const handleGithubLogin = () => {
    const provider = new GithubAuthProvider();
    setError('');
    signInWithPopup(auth, provider)
      .then((result) => {
        const user = result.user;
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
        const user = result.user;
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
      <Text style={styles.title}>Inscription</Text>
      <TextInput
        style={styles.input}
        placeholder="Nom"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
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

      <View style={styles.separator}>
        <View style={styles.line} />
        <Text style={styles.separatorText}>ou</Text>
        <View style={styles.line} />
      </View>

      {/* GitHub & Facebook : signInWithPopup n'existe que sur le web */}
      {Platform.OS === 'web' && (
        <View style={styles.row}>
          <Pressable
            style={[styles.gridButton, styles.githubButton]}
            onPress={handleGithubLogin}
          >
            <Text style={styles.buttonText}>GitHub</Text>
          </Pressable>
          <Pressable
            style={[styles.gridButton, styles.facebookButton]}
            onPress={handleFacebookLogin}
          >
            <Text style={styles.buttonText}>Facebook</Text>
          </Pressable>
        </View>
      )}
      <View style={styles.row}>
        <Pressable
          style={[styles.gridButton, styles.phoneButton]}
          onPress={() => setShowPhoneForm((v) => !v)}
        >
          <Text style={styles.buttonText}>Téléphone</Text>
        </Pressable>
        <Pressable
          style={[styles.gridButton, styles.anonymousButton]}
          onPress={handleAnonymousLogin}
        >
          <Text style={styles.buttonText}>Anonyme</Text>
        </Pressable>
      </View>

      {showPhoneForm && (
        <View style={styles.phoneSection}>
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
              <Pressable style={styles.button} onPress={handleVerifyCode}>
                <Text style={styles.buttonText}>Valider le code</Text>
              </Pressable>
            </>
          )}
        </View>
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
  separator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
    gap: 8,
  },
  line: { flex: 1, height: 1, backgroundColor: '#e5e7eb' },
  separatorText: { color: '#6b7280', fontSize: 14 },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  gridButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  githubButton: { backgroundColor: '#24292e' },
  facebookButton: { backgroundColor: '#1877f2' },
  phoneButton: { backgroundColor: '#16a34a' },
  anonymousButton: { backgroundColor: '#6b7280' },
  phoneSection: {
    marginTop: 8,
    gap: 12,
  },
});
