import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import type { CSSProperties } from 'react';
import { useState } from 'react';
import {
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { uploadToFirebase } from '../utils/storage';

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const TIME_REGEX = /^\d{2}:\d{2}$/;

export type EventFormValues = {
  title: string;
  date: Date;
  location: string;
  description: string;
  photoURL: string;
};

type EventFormProps = {
  // Titre affiché en haut du formulaire
  heading: string;
  // Libellés du bouton de validation (état normal / en cours)
  submitLabel: string;
  submittingLabel: string;
  // Appelé avec les valeurs validées ; gère la création ou la mise à jour
  onSubmit: (values: EventFormValues) => Promise<void>;
  // Fourni en mode édition pour pré-remplir les champs
  initialValues?: EventFormValues;
};

// Convertit une Date en chaîne « AAAA-MM-JJ » pour le champ date.
function toDateInput(d: Date): string {
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${month}-${day}`;
}

// Convertit une Date en chaîne « HH:MM » pour le champ heure.
function toTimeInput(d: Date): string {
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

// Formulaire d'événement réutilisé par la création (newevent) et l'édition (edit).
export default function EventForm({
  heading,
  submitLabel,
  submittingLabel,
  onSubmit,
  initialValues,
}: EventFormProps) {
  const [title, setTitle] = useState(initialValues?.title ?? '');
  const [date, setDate] = useState(
    initialValues ? toDateInput(initialValues.date) : '',
  );
  const [time, setTime] = useState(
    initialValues ? toTimeInput(initialValues.date) : '',
  );
  const [location, setLocation] = useState(initialValues?.location ?? '');
  const [description, setDescription] = useState(initialValues?.description ?? '');
  const [localPhotoUri, setLocalPhotoUri] = useState<string | null>(
    initialValues?.photoURL ?? null,
  );
  const [photoURL, setPhotoURL] = useState<string | null>(
    initialValues?.photoURL ?? null,
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Sélectionne une image dans la galerie puis l'envoie sur Firebase Storage.
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    });
    if (result.canceled) return;

    const { uri } = result.assets[0];
    setLocalPhotoUri(uri);
    const fileName = `event-${Date.now()}-${uri.split('/').pop() ?? 'photo.jpg'}`;

    setUploading(true);
    try {
      const url = await uploadToFirebase(uri, fileName);
      setPhotoURL(url);
      Toast.show({ type: 'success', text1: 'Photo uploadée' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur upload',
        text2: error instanceof Error ? error.message : 'Erreur inconnue',
      });
      setLocalPhotoUri(initialValues?.photoURL ?? null);
    } finally {
      setUploading(false);
    }
  };

  // Valide tous les champs ; renvoie la date/heure combinée, ou null si invalide.
  const validate = (): Date | null => {
    if (!title.trim()) {
      Toast.show({ type: 'error', text1: 'Titre obligatoire' });
      return null;
    }
    if (!DATE_REGEX.test(date)) {
      Toast.show({ type: 'error', text1: 'Date invalide', text2: 'Format AAAA-MM-JJ' });
      return null;
    }
    if (!TIME_REGEX.test(time)) {
      Toast.show({ type: 'error', text1: 'Heure invalide', text2: 'Format HH:MM' });
      return null;
    }
    const combined = new Date(`${date}T${time}:00`);
    if (Number.isNaN(combined.getTime())) {
      Toast.show({ type: 'error', text1: 'Date/heure invalide' });
      return null;
    }
    if (combined.getTime() < Date.now()) {
      Toast.show({ type: 'error', text1: 'La date doit être dans le futur' });
      return null;
    }
    if (!location.trim()) {
      Toast.show({ type: 'error', text1: 'Lieu obligatoire' });
      return null;
    }
    if (!description.trim()) {
      Toast.show({ type: 'error', text1: 'Description obligatoire' });
      return null;
    }
    if (!photoURL) {
      Toast.show({ type: 'error', text1: 'Photo obligatoire' });
      return null;
    }
    return combined;
  };

  const handleSubmit = async () => {
    const eventDate = validate();
    if (!eventDate || !photoURL) return;

    setSubmitting(true);
    try {
      await onSubmit({
        title: title.trim(),
        date: eventDate,
        location: location.trim(),
        description: description.trim(),
        photoURL,
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>{heading}</Text>

      <Text style={styles.label}>Titre *</Text>
      <TextInput
        style={styles.input}
        placeholder="Soirée d'intégration"
        placeholderTextColor="#9ca3af"
        value={title}
        onChangeText={setTitle}
      />

      <View style={styles.row}>
        <View style={styles.flex1}>
          <Text style={styles.label}>Date *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ ...webInputStyle, color: date ? '#111827' : '#9ca3af' }}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="2026-06-15"
              placeholderTextColor="#9ca3af"
              value={date}
              onChangeText={setDate}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        </View>
        <View style={styles.flex1}>
          <Text style={styles.label}>Heure *</Text>
          {Platform.OS === 'web' ? (
            <input
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              style={{ ...webInputStyle, color: time ? '#111827' : '#9ca3af' }}
            />
          ) : (
            <TextInput
              style={styles.input}
              placeholder="20:00"
              placeholderTextColor="#9ca3af"
              value={time}
              onChangeText={setTime}
              autoCapitalize="none"
              autoCorrect={false}
            />
          )}
        </View>
      </View>

      <Text style={styles.label}>Lieu *</Text>
      <TextInput
        style={styles.input}
        placeholder="Campus Ynov, Bordeaux"
        placeholderTextColor="#9ca3af"
        value={location}
        onChangeText={setLocation}
      />

      <Text style={styles.label}>Description *</Text>
      <TextInput
        style={[styles.input, styles.textarea]}
        placeholder="Détails de l'événement..."
        placeholderTextColor="#9ca3af"
        value={description}
        onChangeText={setDescription}
        multiline
        textAlignVertical="top"
      />

      <Text style={styles.label}>Photo d&apos;illustration *</Text>
      {localPhotoUri ? (
        <Image source={{ uri: localPhotoUri }} style={styles.preview} />
      ) : (
        <View style={[styles.preview, styles.previewEmpty]}>
          <FontAwesome name="image" size={32} color="#9ca3af" />
        </View>
      )}
      <Pressable
        style={[styles.photoButton, uploading && styles.buttonDisabled]}
        onPress={pickImage}
        disabled={uploading}
      >
        <FontAwesome name="camera" size={14} color="#fff" />
        <Text style={styles.photoButtonText}>
          {uploading ? 'Upload...' : photoURL ? 'Changer la photo' : 'Choisir une photo'}
        </Text>
      </Pressable>

      <Pressable
        style={[styles.submitButton, (submitting || uploading) && styles.buttonDisabled]}
        onPress={handleSubmit}
        disabled={submitting || uploading}
      >
        <Text style={styles.submitButtonText}>
          {submitting ? submittingLabel : submitLabel}
        </Text>
      </Pressable>
    </ScrollView>
  );
}

// Style des champs date/heure natifs HTML (web uniquement).
const webInputStyle: CSSProperties = {
  borderWidth: 1,
  borderColor: '#d1d5db',
  borderStyle: 'solid',
  borderRadius: 8,
  padding: 12,
  fontSize: 16,
  backgroundColor: '#fff',
  marginTop: 4,
  fontFamily: 'inherit',
  width: '100%',
  boxSizing: 'border-box',
};

const styles = StyleSheet.create({
  container: { padding: 24, gap: 6 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginTop: 12,
  },
  input: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#fff',
    marginTop: 4,
  },
  textarea: { minHeight: 120 },
  row: { flexDirection: 'row', gap: 12 },
  flex1: { flex: 1 },
  preview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    marginTop: 8,
  },
  previewEmpty: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderStyle: 'dashed',
  },
  photoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#6b7280',
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 8,
  },
  photoButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  submitButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  submitButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  buttonDisabled: { opacity: 0.6 },
});
