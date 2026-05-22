import { FontAwesome } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { onAuthStateChanged, signOut, updateProfile, User, UserInfo } from 'firebase/auth';
import { useEffect, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Toast from 'react-native-toast-message';
import { auth } from '../firebaseConfig';
import { firebaseErrorMessage } from '../utils/firebaseErrors';
import { uploadToFirebase } from '../utils/storage';
import { updateUserPhotoUrl } from '../utils/userPhoto';

type ProviderMeta = {
  label: string;
  icon: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
};

const PROVIDER_META: Record<string, ProviderMeta> = {
  'password': { label: 'Email / Mot de passe', icon: 'envelope', color: '#0f766e' },
  'github.com': { label: 'GitHub', icon: 'github', color: '#111827' },
  'facebook.com': { label: 'Facebook', icon: 'facebook', color: '#1877f2' },
  'google.com': { label: 'Google', icon: 'google', color: '#ea4335' },
  'phone': { label: 'Téléphone', icon: 'phone', color: '#2563eb' },
};

const ANONYMOUS_META: ProviderMeta = {
  label: 'Anonyme',
  icon: 'user-secret',
  color: '#6b7280',
};

function getProviderMeta(providerId: string): ProviderMeta {
  return PROVIDER_META[providerId] ?? {
    label: providerId,
    icon: 'question-circle',
    color: '#6b7280',
  };
}

function ProviderCard({ profile }: { profile: UserInfo }) {
  const meta = getProviderMeta(profile.providerId);
  const fields: { label: string; value: string | null }[] = [
    { label: 'Provider UID', value: profile.uid },
    { label: 'Nom', value: profile.displayName },
    { label: 'Email', value: profile.email },
    { label: 'Téléphone', value: profile.phoneNumber },
  ];

  return (
    <View style={styles.card}>
      <View style={styles.providerHeader}>
        <View style={[styles.providerBadge, { backgroundColor: meta.color }]}>
          <FontAwesome name={meta.icon} size={18} color="#fff" />
        </View>
        <View style={styles.providerHeaderText}>
          <Text style={styles.providerLabel}>{meta.label}</Text>
          <Text style={styles.providerId}>{profile.providerId}</Text>
        </View>
        {profile.photoURL ? (
          <Image source={{ uri: profile.photoURL }} style={styles.providerAvatar} />
        ) : null}
      </View>

      {fields
        .filter((f) => f.value)
        .map((f) => (
          <View key={f.label} style={styles.field}>
            <Text style={styles.label}>{f.label}</Text>
            <Text style={styles.value} numberOfLines={1}>
              {f.value}
            </Text>
          </View>
        ))}
    </View>
  );
}

function AnonymousProviderCard() {
  return (
    <View style={styles.card}>
      <View style={styles.providerHeader}>
        <View style={[styles.providerBadge, { backgroundColor: ANONYMOUS_META.color }]}>
          <FontAwesome name={ANONYMOUS_META.icon} size={18} color="#fff" />
        </View>
        <View style={styles.providerHeaderText}>
          <Text style={styles.providerLabel}>{ANONYMOUS_META.label}</Text>
          <Text style={styles.providerId}>Aucun provider externe</Text>
        </View>
      </View>
    </View>
  );
}

export default function ProfilPage() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [photoURL, setPhotoURL] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setDisplayName(currentUser.displayName ?? '');
        setPhotoURL(currentUser.photoURL ?? '');
      } else {
        router.replace('/connexion');
      }
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (result.canceled) return;

    const { uri } = result.assets[0];
    const fileName = uri.split('/').pop() ?? `photo-${Date.now()}.jpg`;

    setUploading(true);
    try {
      const downloadUrl = await uploadToFirebase(uri, fileName);
      const ok = await updateUserPhotoUrl(downloadUrl);
      if (!ok) throw new Error('Mise à jour du profil échouée');

      setPhotoURL(downloadUrl);
      setUser(auth.currentUser);
      Toast.show({ type: 'success', text1: 'Photo mise à jour' });
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur upload',
        text2: error instanceof Error ? error.message : 'Erreur inconnue',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleUpdateProfile = () => {
    if (!auth.currentUser) return;
    setSaving(true);
    updateProfile(auth.currentUser, {
      displayName: displayName.trim() || null,
      photoURL: photoURL.trim() || null,
    })
      .then(() => {
        setUser(auth.currentUser);
        Toast.show({ type: 'success', text1: 'Profil mis à jour' });
      })
      .catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Erreur mise à jour',
          text2: firebaseErrorMessage(error),
        });
      })
      .finally(() => setSaving(false));
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        Toast.show({ type: 'success', text1: 'Déconnecté' });
        router.replace('/connexion');
      })
      .catch((error) => {
        Toast.show({
          type: 'error',
          text1: 'Erreur déconnexion',
          text2: firebaseErrorMessage(error),
        });
      });
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.subtitle}>Chargement...</Text>
      </View>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Profil</Text>

      <View style={styles.avatarSection}>
        {user.photoURL ? (
          <Image source={{ uri: user.photoURL }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatar, styles.avatarPlaceholder]}>
            <FontAwesome name="user" size={48} color="#9ca3af" />
          </View>
        )}
        <Pressable
          style={[styles.avatarButton, uploading && styles.saveButtonDisabled]}
          onPress={pickImage}
          disabled={uploading}
        >
          <FontAwesome name="camera" size={14} color="#fff" />
          <Text style={styles.avatarButtonText}>
            {uploading ? 'Upload...' : 'Changer la photo'}
          </Text>
        </Pressable>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>Nom affiché</Text>
        <Text style={styles.value}>{user.displayName ?? '—'}</Text>

        <Text style={styles.label}>Email</Text>
        <Text style={styles.value}>{user.email ?? '—'}</Text>

        <Text style={styles.label}>Photo URL</Text>
        <Text style={styles.value}>{user.photoURL ?? '—'}</Text>

        <Text style={styles.label}>Email vérifié</Text>
        <Text style={styles.value}>{user.emailVerified ? 'Oui' : 'Non'}</Text>

        <Text style={styles.label}>UID</Text>
        <Text style={styles.value}>{user.uid}</Text>
      </View>

      <Text style={styles.sectionTitle}>Modifier mon profil</Text>

      <View style={styles.card}>
        <Text style={styles.label}>Nom affiché</Text>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder="Jane Q. User"
          autoCapitalize="words"
        />

        <Text style={styles.label}>Photo URL</Text>
        <TextInput
          style={styles.input}
          value={photoURL}
          onChangeText={setPhotoURL}
          placeholder="https://example.com/photo.jpg"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />

        <Pressable
          style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          onPress={handleUpdateProfile}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Text>
        </Pressable>
      </View>

      <Text style={styles.sectionTitle}>Providers connectés</Text>

      {user.providerData.length === 0 ? (
        <AnonymousProviderCard />
      ) : (
        user.providerData.map((profile) => (
          <ProviderCard key={profile.providerId} profile={profile} />
        ))
      )}

      <Pressable style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Se déconnecter</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    padding: 24,
    gap: 16,
  },
  title: { fontSize: 28, fontWeight: 'bold', marginBottom: 8 },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e5e7eb',
  },
  avatarPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  avatarButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginTop: 16,
    alignSelf: 'flex-start',
  },
  subtitle: { fontSize: 16, color: '#6b7280', textAlign: 'center' },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 4,
  },
  providerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  providerBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  providerHeaderText: {
    flex: 1,
  },
  providerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  providerId: {
    fontSize: 12,
    color: '#6b7280',
  },
  providerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
  },
  field: {
    gap: 2,
  },
  label: {
    fontSize: 12,
    color: '#6b7280',
    textTransform: 'uppercase',
    marginTop: 8,
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    color: '#111827',
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
  saveButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  button: {
    backgroundColor: '#dc2626',
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 24,
  },
  buttonText: { color: 'white', fontWeight: 'bold', fontSize: 16 },
});
