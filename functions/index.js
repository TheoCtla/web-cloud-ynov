const { onDocumentCreated } = require('firebase-functions/v2/firestore');
const logger = require('firebase-functions/logger');
const { initializeApp } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

initializeApp();

// API REST d'Expo pour l'envoi de notifications push.
const EXPO_PUSH_API = 'https://exp.host/--/api/v2/push/send';

// Déclenchée à chaque création d'un événement : envoie une notification push
// à tous les utilisateurs dont le token est enregistré dans `pushTokens`.
// L'envoi est fait côté serveur -> pas de blocage CORS (contrairement au web).
exports.broadcastNewEvent = onDocumentCreated('events/{eventId}', async (event) => {
  const data = event.data?.data();
  if (!data) return;

  // Récupère tous les tokens enregistrés (Admin SDK : ignore les règles).
  const snapshot = await getFirestore().collection('pushTokens').get();
  const allTokens = snapshot.docs
    .map((doc) => doc.data().token)
    .filter((token) => typeof token === 'string' && token.length > 0);
  // Déduplication : un même appareil peut avoir plusieurs documents pushTokens
  // (ex: plusieurs connexions anonymes) avec le même token push.
  const tokens = [...new Set(allTokens)];

  if (tokens.length === 0) {
    logger.info('Aucun token enregistré, broadcast ignoré.');
    return;
  }

  // Un message par destinataire (format attendu par l'API Expo).
  const messages = tokens.map((to) => ({
    to,
    sound: 'default',
    title: 'Nouvel événement',
    body: data.title || 'Un nouvel événement a été publié',
  }));

  try {
    await fetch(EXPO_PUSH_API, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(messages),
    });
    logger.info(`Broadcast envoyé à ${tokens.length} appareil(s).`);
  } catch (error) {
    logger.error('Échec du broadcast push:', error);
  }
});
