# Akarina — Plateforme de Financement Participatif Immobilier

Plateforme de crowdfunding islamique (contrat Mousharaka) pour des projets immobiliers en Mauritanie.

---

## Structure du projet

```
akarina/
├── mobile/     # Application React Native (Expo) — investisseurs
└── web/        # Interface admin (à venir)
```

---

## Prérequis

- [Node.js](https://nodejs.org/) v18 ou supérieur
- [npm](https://www.npmjs.com/) v9 ou supérieur
- [Expo CLI](https://docs.expo.dev/get-started/installation/) : `npm install -g expo-cli`
- [Expo Go](https://expo.dev/go) installé sur ton téléphone (iOS ou Android)
- Un compte [Firebase](https://firebase.google.com/)

---

## 1. Créer et configurer le projet Firebase

### 1.1 Créer le projet

1. Aller sur [console.firebase.google.com](https://console.firebase.google.com)
2. Cliquer **Ajouter un projet**
3. Nom : `akarina` → Continuer
4. Désactiver Google Analytics si non nécessaire → Créer le projet

### 1.2 Activer Authentication (Phone OTP)

1. Dans le menu gauche : **Build → Authentication**
2. Cliquer **Commencer**
3. Onglet **Sign-in method** → activer **Téléphone**
4. Sauvegarder

### 1.3 Créer la base Firestore

1. **Build → Firestore Database**
2. Cliquer **Créer une base de données**
3. Choisir **Mode test** (pour le développement — à sécuriser avant prod)
4. Sélectionner la région : `eur3 (europe-west)` ou la plus proche
5. Terminer

### 1.4 Activer Storage

1. **Build → Storage**
2. Cliquer **Commencer**
3. Mode test → Suivant → Terminer

### 1.5 Enregistrer l'application mobile

1. Dans **Paramètres du projet** (icône engrenage) → **Vos applications**
2. Cliquer l'icône **</>** (Web app) — Firebase JS SDK fonctionne avec Expo
3. Nom : `akarina-mobile` → Enregistrer
4. Copier les valeurs du bloc `firebaseConfig` affiché :

```js
const firebaseConfig = {
  apiKey: "...",
  authDomain: "...",
  projectId: "...",
  storageBucket: "...",
  messagingSenderId: "...",
  appId: "..."
};
```

---

## 2. Configurer les variables d'environnement

```bash
cd mobile
cp .env.example .env
```

Ouvrir `.env` et remplir avec les valeurs copiées à l'étape 1.5 :

```env
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=akarina-xxxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=akarina-xxxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=akarina-xxxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
EXPO_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abc123
```

> Les variables préfixées `EXPO_PUBLIC_` sont automatiquement exposées au code client par Expo.

---

## 3. Lancer l'application en local

```bash
cd mobile
npm install
npm start
```

Un QR code s'affiche dans le terminal.

- **iOS** : Scanner avec l'app Appareil Photo
- **Android** : Scanner depuis l'app Expo Go

L'application se charge directement sur ton téléphone via le réseau local.

### Autres commandes utiles

```bash
npm run android   # Lancer sur émulateur Android
npm run ios       # Lancer sur simulateur iOS (macOS requis)
npm run web       # Lancer dans le navigateur
```

---

## 4. Créer un compte Admin manuellement

Les comptes admin ne sont pas créables depuis l'app. Après une première connexion d'un utilisateur :

1. Aller dans **Firestore → Collection `users`**
2. Trouver le document de l'utilisateur (ID = UID Firebase Auth)
3. Modifier le champ `role` : `"INVESTOR"` → `"ADMIN"`

---

## 5. Règles Firestore (développement)

En mode test, toutes les lectures/écritures sont autorisées pendant 30 jours. Pour prolonger ou sécuriser :

1. **Firestore → Règles**
2. Remplacer par :

```js
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs : lecture/écriture sur son propre document
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    // Projets : lecture publique, écriture admin uniquement
    match /projects/{projectId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'ADMIN';
    }
    // Investissements : lecture/écriture sur les siens
    match /investments/{investmentId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
    // Documents KYC : lecture/écriture sur les siens
    match /documents/{documentId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
    }
  }
}
```

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Mobile | React Native + Expo SDK 57 |
| Navigation | Expo Router (file-based) |
| Base de données | Firebase Firestore |
| Authentification | Firebase Auth (Phone OTP) |
| Fichiers | Firebase Storage |
| Paiement | Bankily API (simulé en MVP) |
| Contrats | PDF généré depuis template HTML |
| Langue | TypeScript |
