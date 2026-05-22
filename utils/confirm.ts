import { Alert, Platform } from 'react-native';

// Demande une confirmation à l'utilisateur avant une action destructrice.
// Sur le web : window.confirm ; sur mobile : boîte de dialogue native Alert.
export function confirmAction(message: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(
      typeof window !== 'undefined' ? window.confirm(message) : false,
    );
  }
  return new Promise((resolve) => {
    Alert.alert('Confirmation', message, [
      { text: 'Annuler', style: 'cancel', onPress: () => resolve(false) },
      { text: 'Supprimer', style: 'destructive', onPress: () => resolve(true) },
    ]);
  });
}
