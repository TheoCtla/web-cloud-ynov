import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

// Enregistre (ou met à jour) le token de notification d'un utilisateur.
// 1 document par utilisateur, identifié par son uid.
// La lecture de tous les tokens pour le broadcast est faite côté serveur
// (Cloud Function `broadcastNewEvent`), pas depuis le client.
export async function savePushToken(userId: string, token: string): Promise<void> {
  await setDoc(doc(db, 'pushTokens', userId), {
    userId,
    token,
    updatedAt: serverTimestamp(),
  });
}
