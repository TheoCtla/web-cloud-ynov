# web-cloud-ynov

Projet individuel Ynov M2 — Développer Pour Le Cloud.

Application React Native (Expo) avec authentification multi-providers Firebase, déployée automatiquement sur GitHub Pages via GitHub Actions, et buildée sur EAS pour Android.

## 🌐 Application déployée

**URL** : https://theoctla.github.io/web-cloud-ynov/

## ✨ Fonctionnalités

### Navigation (Expo Router)

- Page d'accueil
- Page Connexion
- Page Inscription
- Page Connexion par téléphone
- Page Profil
- Navbar accessible sur toutes les pages

### Authentification (Firebase Auth)

- **Email / Mot de passe** (avec champ nom à l'inscription, validation des formulaires)
- **Téléphone (OTP)** via SMS + reCAPTCHA
- **GitHub OAuth**
- **Facebook OAuth**
- **Connexion anonyme**

> ⚠️ **Note pour la connexion téléphone (OTP)** : le projet est sur le plan Firebase Spark (gratuit), qui n'autorise pas l'envoi de vrais SMS. Pour tester la connexion par téléphone, utilise le **numéro de test** déclaré dans la console Firebase :
>
> - **Numéro** : `+33612345678`
> - **Code OTP** : `123456`
>
> Le flow d'authentification est complet (`signInWithPhoneNumber` + `RecaptchaVerifier` + `confirmation.confirm`), seul l'envoi du SMS est bypassé par Firebase pour les numéros de test.

### UX

- Toaster (`react-native-toast-message`) sur succès et erreurs
- Messages d'erreur Firebase traduits en français (helper `utils/firebaseErrors.ts`)
- Redirections automatiques :
  - après connexion / inscription → `/profil`
  - après déconnexion → `/connexion`

## 🛠 Stack technique

- Expo SDK 54 + Expo Router
- React Native 0.81 + React 19
- TypeScript
- Firebase JS SDK 12 (Auth)
- `react-native-toast-message`

## 🚀 Lancer le projet en local

```bash
npm install
npm run web
```

L'app web sera accessible sur `http://localhost:8081`.

## 🔁 CI/CD

Workflow GitHub Actions : `.github/workflows/build_deploy_web_android.yml`

À chaque push sur `main` :

1. **Build web** — `expo export -p web` → `dist/`
2. **Deploy** — déploiement automatique sur GitHub Pages
3. **Build Android** — déclenche un build EAS (`eas build --platform android`)

Secrets requis dans le repo :

- `EXPO_TOKEN` — token EAS pour lancer les builds (https://expo.dev/accounts/[user]/settings/access-tokens)

## 📁 Structure

```
app/
  _layout.tsx          # navbar + Stack
  index.tsx            # accueil
  connexion.tsx        # email + GitHub + Facebook + anonyme
  connexion-tel.tsx    # OTP téléphone
  inscription.tsx      # email + nom + mdp
  profil.tsx           # texte requis + déconnexion
firebaseConfig.ts      # init Firebase + export auth
metro.config.js        # +cjs pour Firebase
utils/firebaseErrors.ts
```
