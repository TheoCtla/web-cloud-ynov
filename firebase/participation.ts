import {
  doc,
  getDoc,
  increment,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../firebaseConfig';

export async function isParticipating(eventId: string, userId: string): Promise<boolean> {
  const snapshot = await getDoc(doc(db, 'events', eventId, 'participants', userId));
  return snapshot.exists();
}

export async function joinEvent(
  eventId: string,
  userId: string,
  userName: string | null,
): Promise<void> {
  const participantRef = doc(db, 'events', eventId, 'participants', userId);
  const eventRef = doc(db, 'events', eventId);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(participantRef);
    if (existing.exists()) return;

    tx.set(participantRef, {
      userName,
      joinedAt: serverTimestamp(),
    });
    tx.update(eventRef, { participantsCount: increment(1) });
  });
}

export async function leaveEvent(eventId: string, userId: string): Promise<void> {
  const participantRef = doc(db, 'events', eventId, 'participants', userId);
  const eventRef = doc(db, 'events', eventId);

  await runTransaction(db, async (tx) => {
    const existing = await tx.get(participantRef);
    if (!existing.exists()) return;

    tx.delete(participantRef);
    tx.update(eventRef, { participantsCount: increment(-1) });
  });
}
