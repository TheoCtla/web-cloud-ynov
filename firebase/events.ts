import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export type Event = {
  id: string;
  title: string;
  date: Timestamp;
  location: string;
  description: string;
  photoURL: string;
  createdBy: string;
  createdByName: string | null;
  createdByPhotoURL: string | null;
  createdAt: Timestamp | null;
  participantsCount: number;
};

export type NewEventInput = {
  title: string;
  date: Date;
  location: string;
  description: string;
  photoURL: string;
  createdBy: string;
  createdByName: string | null;
  createdByPhotoURL: string | null;
};

// Champs modifiables d'un événement existant (l'auteur, lui, ne change pas).
export type UpdateEventInput = {
  title: string;
  date: Date;
  location: string;
  description: string;
  photoURL: string;
};

export async function createEvent(input: NewEventInput): Promise<string> {
  const docRef = await addDoc(collection(db, 'events'), {
    title: input.title,
    date: Timestamp.fromDate(input.date),
    location: input.location,
    description: input.description,
    photoURL: input.photoURL,
    createdBy: input.createdBy,
    createdByName: input.createdByName,
    createdByPhotoURL: input.createdByPhotoURL,
    createdAt: serverTimestamp(),
    participantsCount: 0,
  });
  return docRef.id;
}

export async function getUpcomingEvents(): Promise<Event[]> {
  const now = Timestamp.now();
  const q = query(
    collection(db, 'events'),
    where('date', '>=', now),
    orderBy('date', 'asc'),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((d) => ({ id: d.id, ...(d.data() as Omit<Event, 'id'>) }));
}

export async function getEvent(id: string): Promise<Event | null> {
  const snapshot = await getDoc(doc(db, 'events', id));
  if (!snapshot.exists()) return null;
  return { id: snapshot.id, ...(snapshot.data() as Omit<Event, 'id'>) };
}

// Met à jour les champs éditables d'un événement.
// La règle Firestore restreint de toute façon cette opération à son auteur.
export async function updateEvent(id: string, input: UpdateEventInput): Promise<void> {
  await updateDoc(doc(db, 'events', id), {
    title: input.title,
    date: Timestamp.fromDate(input.date),
    location: input.location,
    description: input.description,
    photoURL: input.photoURL,
  });
}

// Supprime un événement ET ses sous-collections (commentaires + participants)
// en une seule opération atomique grâce à un writeBatch.
export async function deleteEvent(id: string): Promise<void> {
  const batch = writeBatch(db);
  const [commentsSnap, participantsSnap] = await Promise.all([
    getDocs(collection(db, 'events', id, 'comments')),
    getDocs(collection(db, 'events', id, 'participants')),
  ]);
  commentsSnap.forEach((d) => batch.delete(d.ref));
  participantsSnap.forEach((d) => batch.delete(d.ref));
  batch.delete(doc(db, 'events', id));
  await batch.commit();
}
