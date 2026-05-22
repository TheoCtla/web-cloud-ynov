import Constants from 'expo-constants';
import * as Device from 'expo-device';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { savePushToken } from '../firebase/pushTokens';

// Affiche les notifications reçues même quand l'application est au premier plan.
// Ignoré sur le web (les notifications push Expo y sont indisponibles).
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });
}

// Demande la permission, génère le Push Token Expo de l'appareil et
// l'enregistre dans Firestore.
// Ne fait rien sur le web ou sur un émulateur : les notifications push Expo
// nécessitent un appareil physique iOS/Android.
export async function registerForPushNotifications(userId: string): Promise<void> {
  try {
    if (Platform.OS === 'web' || !Device.isDevice) return;

    // Demande la permission si elle n'a pas déjà été accordée.
    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      const requested = await Notifications.requestPermissionsAsync();
      status = requested.status;
    }
    if (status !== 'granted') return;

    // Le projectId EAS est requis pour générer le token.
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    if (!projectId) return;

    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await savePushToken(userId, token);
  } catch (error) {
    // Échec non bloquant : l'application fonctionne sans notifications.
    console.warn('registerForPushNotifications:', error);
  }
}

// Note : l'envoi des notifications (broadcast) est géré côté serveur par la
// Cloud Function `broadcastNewEvent`, déclenchée à la création d'un événement
// (voir le dossier functions/). Cela évite le blocage CORS du web.
