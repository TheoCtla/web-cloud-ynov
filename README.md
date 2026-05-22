# Campus Events — web-cloud-ynov

Projet Ynov M2 — Développer Pour Le Cloud — **Livrable 2 (projet de groupe)**.

**Sujet choisi : Sujet 6 — « Campus Events » (Agenda & Meetups).**

## Application déployée

**URL** : https://theoctla.github.io/web-cloud-ynov/

## Fonctionnalités

### Événements (Cloud Firestore)

- Page d'accueil listant les événements à venir, avec le nom et la photo de l'auteur.
- Vue détaillée : titre, date & heure, lieu, description, photo d'illustration.
- Création d'un événement avec photo d'illustration obligatoire (upload Storage).
- Édition et suppression d'un événement, réservées à son auteur.
  La suppression efface aussi, en cascade, ses commentaires et participations.

### Interaction

- Bouton « Je participe » / annulation, avec compteur de participants.

### Commentaires

- Questions logistiques sur la vue détaillée (point de RDV, covoiturage, matériel…).
- Rédaction réservée aux utilisateurs connectés.
- Édition / suppression d'un commentaire réservées à son auteur.

### Profil & Cloud Storage

- Page de profil détaillée de l'utilisateur connecté.
- Modification du `displayName`, upload et affichage de la photo de profil.

### Authentification (Firebase Auth)

- Email / mot de passe, téléphone (OTP), GitHub, Facebook, connexion anonyme.

### Notifications push (Expo)

- Génération du Push Token Expo à la connexion, stocké dans Firestore (`pushTokens`).
- Broadcast à tous les utilisateurs via une Cloud Function déclenchée à la
  création d'un événement (`functions/broadcastNewEvent`).

### Sécurité

- `firestore.rules` / `storage.rules` stricts : lecture réservée aux utilisateurs
  connectés, modification / suppression réservées au créateur légitime de la donnée.

## Déploiement des règles de sécurité

Les règles sont versionnées dans `firestore.rules` et `storage.rules`
(référencées par `firebase.json`). Pour les appliquer : dans la console Firebase,
ouvrir l'onglet **Règles** de _Firestore Database_ puis de _Storage_, coller le
contenu du fichier correspondant et cliquer sur **Publier**.

## Stack technique

- Expo SDK 54 + Expo Router
- React Native 0.81 + React 19 + TypeScript
- Firebase JS SDK 12 (Auth, Firestore, Storage)
- `expo-notifications`, `expo-image-picker`
- `react-native-toast-message`

## Lancer le projet en local

```bash
npm install
npm run web
```

L'app web sera accessible sur `http://localhost:8081`.

## CI/CD

Workflow GitHub Actions : `.github/workflows/build_deploy_web_android.yml`.

À chaque push sur `main` :

1. **Build web** (`expo export`) + déploiement automatique sur GitHub Pages.
2. **Build Android** — déclenchement d'un build sur EAS.

Secret requis dans le repo : `EXPO_TOKEN` (token EAS).

> **Note connexion téléphone (OTP)** : le projet est sur le plan Firebase Spark
> (gratuit), qui n'envoie pas de vrais SMS. Pour tester, utiliser le numéro de
> test déclaré dans la console Firebase :
>
> - Numéro : `+33612345678`
> - Code OTP : `123456`

## Structure

```
app/
  _layout.tsx               # navbar + Stack + enregistrement push
  index.tsx                 # accueil : liste des événements
  connexion.tsx             # connexion (email, OTP, GitHub, Facebook, anonyme)
  inscription.tsx           # inscription email + nom
  profil.tsx                # profil + photo + déconnexion
  newevent.tsx              # création d'un événement
  event/[id]/index.tsx      # vue détaillée d'un événement
  event/[id]/edit.tsx       # édition d'un événement (auteur)
  event/[id]/newcomment.tsx # rédaction d'un commentaire
components/
  EventForm.tsx             # formulaire d'événement (création + édition)
  Avatar.tsx                # photo de profil ronde réutilisable
firebase/
  events.ts                 # CRUD événements
  comments.ts               # CRUD commentaires
  participation.ts          # participation (transactions)
  pushTokens.ts             # collection pushTokens
utils/
  storage.ts                # upload Firebase Storage
  userPhoto.ts              # mise à jour photo de profil
  notifications.ts          # permissions + Push Token + broadcast Expo
  confirm.ts                # confirmation avant suppression
  firebaseErrors.ts         # messages d'erreur Firebase en français
functions/
  index.js                  # Cloud Function broadcastNewEvent (envoi des notifs)
firestore.rules             # règles de sécurité Firestore
storage.rules               # règles de sécurité Storage
firebase.json               # règles Firestore/Storage + Cloud Functions
```
