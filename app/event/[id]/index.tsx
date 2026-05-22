import { FontAwesome } from '@expo/vector-icons';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { onAuthStateChanged, User } from 'firebase/auth';
import { Timestamp } from 'firebase/firestore';
import { useCallback, useEffect, useState } from 'react';
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
import Avatar from '../../../components/Avatar';
import {
  Comment,
  deleteComment,
  getComments,
  updateComment,
} from '../../../firebase/comments';
import { deleteEvent, Event, getEvent } from '../../../firebase/events';
import { isParticipating, joinEvent, leaveEvent } from '../../../firebase/participation';
import { auth } from '../../../firebaseConfig';
import { confirmAction } from '../../../utils/confirm';
import { firebaseErrorMessage } from '../../../utils/firebaseErrors';

function formatEventDate(timestamp: Timestamp) {
  return timestamp.toDate().toLocaleString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatCommentDate(timestamp: Comment['date']) {
  if (!timestamp) return '';
  return timestamp.toDate().toLocaleString('fr-FR', {
    dateStyle: 'short',
    timeStyle: 'short',
  });
}

export default function EventDetailPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [participating, setParticipating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);
  const [deleting, setDeleting] = useState(false);
  // Commentaire en cours d'édition en ligne
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState('');
  const [savingComment, setSavingComment] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const [e, c] = await Promise.all([getEvent(id), getComments(id)]);
      setEvent(e);
      setComments(c);
      if (auth.currentUser) {
        setParticipating(await isParticipating(id, auth.currentUser.uid));
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      if (u && id) {
        setParticipating(await isParticipating(id, u.uid));
      } else {
        setParticipating(false);
      }
    });
    return unsubscribe;
  }, [id]);

  const toggleParticipation = async () => {
    if (!user || !id || !event) return;
    setToggling(true);
    try {
      if (participating) {
        await leaveEvent(id, user.uid);
        setParticipating(false);
        setEvent({ ...event, participantsCount: Math.max(0, event.participantsCount - 1) });
        Toast.show({ type: 'success', text1: 'Participation annulée' });
      } else {
        await joinEvent(id, user.uid, user.displayName);
        setParticipating(true);
        setEvent({ ...event, participantsCount: event.participantsCount + 1 });
        Toast.show({ type: 'success', text1: 'Tu participes !' });
      }
    } catch (error) {
      Toast.show({
        type: 'error',
        text1: 'Erreur',
        text2: firebaseErrorMessage(error),
      });
    } finally {
      setToggling(false);
    }
  };

  // L'utilisateur connecté est-il l'auteur de l'événement ?
  const isOwner = !!user && !!event && user.uid === event.createdBy;

  const handleDeleteEvent = async () => {
    if (!id || !event) return;
    const ok = await confirmAction(
      `Supprimer l'événement « ${event.title} » ? Les commentaires et participations seront aussi supprimés.`,
    );
    if (!ok) return;
    setDeleting(true);
    try {
      await deleteEvent(id);
      Toast.show({ type: 'success', text1: 'Événement supprimé' });
      router.replace('/');
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: firebaseErrorMessage(error) });
      setDeleting(false);
    }
  };

  const startEditComment = (comment: Comment) => {
    setEditingCommentId(comment.id);
    setEditingText(comment.text);
  };

  const cancelEditComment = () => {
    setEditingCommentId(null);
    setEditingText('');
  };

  const saveEditComment = async () => {
    if (!id || !editingCommentId) return;
    if (!editingText.trim()) {
      Toast.show({ type: 'error', text1: 'Commentaire vide' });
      return;
    }
    setSavingComment(true);
    try {
      await updateComment(id, editingCommentId, editingText.trim());
      setComments((prev) =>
        prev.map((c) =>
          c.id === editingCommentId ? { ...c, text: editingText.trim() } : c,
        ),
      );
      Toast.show({ type: 'success', text1: 'Commentaire modifié' });
      cancelEditComment();
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: firebaseErrorMessage(error) });
    } finally {
      setSavingComment(false);
    }
  };

  const handleDeleteComment = async (comment: Comment) => {
    if (!id) return;
    const ok = await confirmAction('Supprimer ce commentaire ?');
    if (!ok) return;
    try {
      await deleteComment(id, comment.id);
      setComments((prev) => prev.filter((c) => c.id !== comment.id));
      Toast.show({ type: 'success', text1: 'Commentaire supprimé' });
    } catch (error) {
      Toast.show({ type: 'error', text1: 'Erreur', text2: firebaseErrorMessage(error) });
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Chargement...</Text>
      </View>
    );
  }

  if (!event) {
    return (
      <View style={styles.center}>
        <Text style={styles.empty}>Événement introuvable</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: event.photoURL }} style={styles.banner} />

      <View style={styles.content}>
        <Text style={styles.title}>{event.title}</Text>

        {/* Actions réservées à l'auteur de l'événement */}
        {isOwner && (
          <View style={styles.ownerActions}>
            <Pressable
              style={[styles.ownerButton, styles.editButton]}
              onPress={() => router.push(`/event/${id}/edit`)}
            >
              <FontAwesome name="pencil" size={13} color="#fff" />
              <Text style={styles.ownerButtonText}>Éditer</Text>
            </Pressable>
            <Pressable
              style={[
                styles.ownerButton,
                styles.deleteButton,
                deleting && styles.buttonDisabled,
              ]}
              onPress={handleDeleteEvent}
              disabled={deleting}
            >
              <FontAwesome name="trash" size={13} color="#fff" />
              <Text style={styles.ownerButtonText}>
                {deleting ? 'Suppression...' : 'Supprimer'}
              </Text>
            </Pressable>
          </View>
        )}

        <View style={styles.metaCard}>
          <View style={styles.metaRow}>
            <FontAwesome name="calendar" size={14} color="#2563eb" />
            <Text style={styles.metaText}>{formatEventDate(event.date)}</Text>
          </View>
          <View style={styles.metaRow}>
            <FontAwesome name="map-marker" size={14} color="#2563eb" />
            <Text style={styles.metaText}>{event.location}</Text>
          </View>
          <View style={styles.metaRow}>
            <Avatar uri={event.createdByPhotoURL} size={24} />
            <Text style={styles.metaText}>
              Organisé par {event.createdByName ?? 'Anonyme'}
            </Text>
          </View>
        </View>

        <Text style={styles.description}>{event.description}</Text>

        <View style={styles.participationBlock}>
          <View style={styles.countBlock}>
            <FontAwesome name="users" size={20} color="#2563eb" />
            <Text style={styles.countNumber}>{event.participantsCount}</Text>
            <Text style={styles.countLabel}>
              participant{event.participantsCount > 1 ? 's' : ''}
            </Text>
          </View>

          {user ? (
            <Pressable
              style={[
                styles.joinButton,
                participating && styles.joinButtonActive,
                toggling && styles.buttonDisabled,
              ]}
              onPress={toggleParticipation}
              disabled={toggling}
            >
              <FontAwesome
                name={participating ? 'check' : 'plus'}
                size={14}
                color="#fff"
              />
              <Text style={styles.joinButtonText}>
                {participating ? 'Je participe ✓' : 'Je participe'}
              </Text>
            </Pressable>
          ) : (
            <Link href="/connexion" style={styles.loginLink}>
              Se connecter pour participer
            </Link>
          )}
        </View>

        <View style={styles.separator} />

        <View style={styles.commentsHeader}>
          <Text style={styles.sectionTitle}>
            Questions & commentaires ({comments.length})
          </Text>
          {user ? (
            <Link href={`/event/${id}/newcomment`} asChild>
              <Pressable style={styles.commentButton}>
                <Text style={styles.commentButtonText}>+ Commenter</Text>
              </Pressable>
            </Link>
          ) : null}
        </View>

        {comments.length === 0 ? (
          <Text style={styles.empty}>Aucune question pour le moment</Text>
        ) : (
          comments.map((c) => {
            const canManage = !!user && user.uid === c.createdBy;
            const isEditing = editingCommentId === c.id;
            return (
              <View key={c.id} style={styles.commentCard}>
                <View style={styles.commentHeader}>
                  <Avatar uri={c.createdByPhotoURL} size={32} />
                  <View style={styles.commentHeaderText}>
                    <Text style={styles.commentAuthor}>
                      {c.createdByName ?? 'Anonyme'}
                    </Text>
                    <Text style={styles.commentDate}>
                      {formatCommentDate(c.date)}
                    </Text>
                  </View>
                </View>

                {isEditing ? (
                  <>
                    <TextInput
                      style={styles.commentEditInput}
                      value={editingText}
                      onChangeText={setEditingText}
                      multiline
                      textAlignVertical="top"
                    />
                    <View style={styles.commentActions}>
                      <Pressable onPress={cancelEditComment} disabled={savingComment}>
                        <Text style={styles.actionMuted}>Annuler</Text>
                      </Pressable>
                      <Pressable onPress={saveEditComment} disabled={savingComment}>
                        <Text style={styles.actionPrimary}>
                          {savingComment ? 'Enregistrement...' : 'Enregistrer'}
                        </Text>
                      </Pressable>
                    </View>
                  </>
                ) : (
                  <>
                    <Text style={styles.commentText}>{c.text}</Text>
                    {canManage && (
                      <View style={styles.commentActions}>
                        <Pressable onPress={() => startEditComment(c)}>
                          <Text style={styles.actionPrimary}>Éditer</Text>
                        </Pressable>
                        <Pressable onPress={() => handleDeleteComment(c)}>
                          <Text style={styles.actionDanger}>Supprimer</Text>
                        </Pressable>
                      </View>
                    )}
                  </>
                )}
              </View>
            );
          })
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { paddingBottom: 32 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 40 },
  banner: { width: '100%', aspectRatio: 16 / 9, backgroundColor: '#f3f4f6' },
  content: { padding: 24, gap: 12 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#111827' },
  ownerActions: { flexDirection: 'row', gap: 10 },
  ownerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  editButton: { backgroundColor: '#6b7280' },
  deleteButton: { backgroundColor: '#dc2626' },
  ownerButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  metaCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    gap: 8,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { fontSize: 14, color: '#374151', flex: 1 },
  description: { fontSize: 16, lineHeight: 24, color: '#111827', marginTop: 4 },
  participationBlock: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
    gap: 12,
  },
  countBlock: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  countNumber: { fontSize: 22, fontWeight: 'bold', color: '#2563eb' },
  countLabel: { fontSize: 14, color: '#6b7280' },
  joinButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  joinButtonActive: { backgroundColor: '#16a34a' },
  joinButtonText: { color: '#fff', fontWeight: '600', fontSize: 14 },
  loginLink: { color: '#2563eb', fontSize: 14, fontWeight: '500' },
  separator: { height: 1, backgroundColor: '#e5e7eb', marginVertical: 16 },
  sectionTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },
  commentsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentButton: {
    backgroundColor: '#2563eb',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  commentButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  commentCard: {
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    padding: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginBottom: 8,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  commentHeaderText: { flex: 1 },
  commentAuthor: { fontWeight: '600', color: '#111827', fontSize: 14 },
  commentDate: { fontSize: 12, color: '#6b7280' },
  commentText: { fontSize: 15, color: '#111827', lineHeight: 22 },
  commentEditInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 10,
    fontSize: 15,
    backgroundColor: '#fff',
    minHeight: 70,
    marginTop: 2,
  },
  commentActions: { flexDirection: 'row', gap: 18, marginTop: 8 },
  actionPrimary: { color: '#2563eb', fontWeight: '600', fontSize: 13 },
  actionMuted: { color: '#6b7280', fontWeight: '600', fontSize: 13 },
  actionDanger: { color: '#dc2626', fontWeight: '600', fontSize: 13 },
  empty: { fontSize: 14, color: '#6b7280', textAlign: 'center' },
  buttonDisabled: { opacity: 0.6 },
});
