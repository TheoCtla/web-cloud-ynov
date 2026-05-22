import { router } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { useEffect, useState } from 'react';
import Toast from 'react-native-toast-message';
import EventForm, { EventFormValues } from '../components/EventForm';
import { createEvent } from '../firebase/events';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';

export default function NewEventPage() {
  const [user, setUser] = useState<User | null>(null);

  // La création est réservée aux utilisateurs connectés.
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

  const handleSubmit = async (values: EventFormValues) => {
    if (!user) return;
    try {
      await createEvent({
        ...values,
        createdBy: user.uid,
        createdByName: user.displayName,
        createdByPhotoURL: user.photoURL,
      });
      // Le broadcast push est géré côté serveur par la Cloud Function
      // broadcastNewEvent, déclenchée par la création du document.
      Toast.show({ type: 'success', text1: 'Événement créé' });
      router.replace('/');
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur création',
        text2: firebaseErrorMessage(error),
      });
    }
  };

  if (!user) return null;

  return (
    <EventForm
      heading="Nouvel événement"
      submitLabel="Créer l'événement"
      submittingLabel="Création..."
      onSubmit={handleSubmit}
    />
  );
}
