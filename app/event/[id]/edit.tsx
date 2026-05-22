import { router, useLocalSearchParams } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';
import EventForm, { EventFormValues } from '../../../components/EventForm';
import { Event, getEvent, updateEvent } from '../../../firebase/events';
import { auth } from '../../../firebaseConfig';
import { firebaseErrorMessage } from '../../../utils/firebaseErrors';

export default function EditEventPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [user, setUser] = useState<User | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  // L'édition est réservée aux utilisateurs connectés.
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

  useEffect(() => {
    if (!id) return;
    getEvent(id)
      .then((e) => setEvent(e))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (values: EventFormValues) => {
    if (!id) return;
    try {
      await updateEvent(id, values);
      Toast.show({ type: 'success', text1: 'Événement modifié' });
      router.replace(`/event/${id}`);
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur de modification',
        text2: firebaseErrorMessage(error),
      });
    }
  };

  if (loading || !user) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>Événement introuvable</Text>
      </View>
    );
  }

  // Garde-fou côté client : seul l'auteur peut éditer. Les règles Firestore
  // bloquent de toute façon la modification côté serveur.
  if (event.createdBy !== user.uid) {
    return (
      <View style={styles.center}>
        <Text style={styles.message}>
          Tu ne peux modifier que tes propres événements.
        </Text>
      </View>
    );
  }

  return (
    <EventForm
      heading="Modifier l'événement"
      submitLabel="Enregistrer les modifications"
      submittingLabel="Enregistrement..."
      onSubmit={handleSubmit}
      initialValues={{
        title: event.title,
        date: event.date.toDate(),
        location: event.location,
        description: event.description,
        photoURL: event.photoURL,
      }}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  message: { fontSize: 15, color: '#6b7280', textAlign: 'center' },
});
