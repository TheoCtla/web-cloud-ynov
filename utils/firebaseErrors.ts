const MESSAGES: Record<string, string> = {
  'auth/email-already-in-use': 'Cet email est déjà utilisé',
  'auth/invalid-email': 'Email invalide',
  'auth/weak-password': 'Mot de passe trop faible (6 caractères minimum)',
  'auth/missing-password': 'Mot de passe requis',
  'auth/user-not-found': 'Aucun compte avec cet email',
  'auth/wrong-password': 'Mot de passe incorrect',
  'auth/invalid-credential': 'Email ou mot de passe incorrect',
  'auth/too-many-requests': 'Trop de tentatives, réessaie plus tard',
  'auth/network-request-failed': 'Erreur réseau, vérifie ta connexion',
  'auth/user-disabled': 'Ce compte a été désactivé',
  'auth/invalid-phone-number': 'Numéro de téléphone invalide',
  'auth/missing-phone-number': 'Numéro de téléphone requis',
  'auth/invalid-verification-code': 'Code de vérification invalide',
  'auth/code-expired': 'Le code a expiré, redemande un nouveau code',
  'auth/missing-verification-code': 'Code de vérification requis',
  'auth/billing-not-enabled': 'Facturation Firebase requise pour les SMS',
  'auth/quota-exceeded': 'Quota SMS atteint, réessaie plus tard',
  'auth/captcha-check-failed': 'Vérification reCAPTCHA échouée',
  'auth/popup-closed-by-user': 'Fenêtre fermée avant la fin de la connexion',
  'auth/account-exists-with-different-credential':
    'Un compte existe déjà avec cet email via un autre fournisseur',
};

export function firebaseErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    const code = (error as { code: string }).code;
    if (code in MESSAGES) return MESSAGES[code];
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return (error as { message: string }).message;
  }
  return 'Une erreur est survenue';
}
