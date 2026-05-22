import { router, useLocalSearchParams } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../../../firebaseConfig';
import { createComment } from '../../../firebase/comments';
import { firebaseErrorMessage } from '../../../utils/firebaseErrors';

export default function NewCommentPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        router.replace('/connexion');
        return;
      }
      setUser(currentUser);
    });
    return unsubscribe;
  }, []);

  const handleSubmit = async () => {
    if (!user || !id) return;
    if (!text.trim()) {
      Toast.show({ type: 'error', text1: 'Commentaire vide' });
      return;
    }

    setSubmitting(true);
    try {
      await createComment(
        id,
        text.trim(),
        user.uid,
        user.displayName,
        user.photoURL,
      );
      Toast.show({ type: 'success', text1: 'Commentaire publié' });
      router.replace(`/event/${id}`);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de publication',
        text2: firebaseErrorMessage(error),
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nouvelle question / commentaire</Text>
      <Text style={styles.hint}>
        Pose une question sur l&apos;organisation (RDV, covoiturage, matériel…)
      </Text>

      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Ta question ou commentaire..."
        value={text}
        onChangeText={setText}
        multiline
        textAlignVertical="top"
      />

      <Pressable
        style={[styles.button, submitting && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting}
      >
        <Text style={styles.buttonText}>
          {submitting ? 'Publication...' : 'Publier'}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 24, gap: 12 },
  title: { fontSize: 24, fontWeight: 'bold' },
  hint: { fontSize: 13, color: '#6b7280', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  textarea: { minHeight: 160 },
  button: {
    backgroundColor: '#2563eb',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
});
