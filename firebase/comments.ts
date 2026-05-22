import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type Comment = {
  id: string;
  text: string;
  createdBy: string;
  createdByName: string | null;
  createdByPhotoURL: string | null;
  date: Timestamp | null;
};

export async function createComment(
  eventId: string,
  text: string,
  createdBy: string,
  createdByName: string | null,
  createdByPhotoURL: string | null,
): Promise<string> {
  const docRef = await addDoc(collection(db, 'events', eventId, 'comments'), {
    text,
    createdBy,
    createdByName,
    createdByPhotoURL,
    date: serverTimestamp(),
  });
  return docRef.id;
}

export async function getComments(eventId: string): Promise<Comment[]> {
  const q = query(
    collection(db, 'events', eventId, 'comments'),
    orderBy('date', 'desc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Comment, 'id'>) }));
}

// Modifie le texte d'un commentaire.
// La règle Firestore restreint cette opération à son auteur.
export async function updateComment(
  eventId: string,
  commentId: string,
  text: string,
): Promise<void> {
  await updateDoc(doc(db, 'events', eventId, 'comments', commentId), { text });
}

// Supprime un commentaire.
// La règle Firestore l'autorise à son auteur ou à l'auteur de l'événement.
export async function deleteComment(eventId: string, commentId: string): Promise<void> {
  await deleteDoc(doc(db, 'events', eventId, 'comments', commentId));
}
