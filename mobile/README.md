# Akarina — Application Mobile

Application mobile investisseur de la plateforme de financement participatif immobilier Akarina (Mauritanie). Permet aux investisseurs de découvrir des projets, investir via un contrat de Mousharaka, payer par Bankily, et suivre leurs investissements.

---

## Stack technique

| Couche | Technologie |
|--------|-------------|
| Framework | React Native `0.86` + Expo SDK `57` |
| Langage | TypeScript (strict) |
| Navigation | Expo Router `~57` (routing par fichiers, dossier `app/`) |
| Auth / DB / Storage | `@react-native-firebase` (SDK natif, pas le SDK JS web) — Auth, Firestore, Storage |
| Animations / gestes | `react-native-reanimated` `4.5.0` + `react-native-worklets` `0.10.0` + `react-native-gesture-handler` `~2.32.0` |
| Internationalisation | `i18next` / `react-i18next` — locales `fr` et `ar` (`src/i18n/locales`) |
| Documents | `expo-print` + `expo-sharing` — génération et partage des contrats PDF |
| Upload pièce d'identité | `expo-image-picker` (KYC) |
| Stockage sécurisé | `expo-secure-store` |
| Paiement | API Bankily (B2B Push/Pull/Webhook) — voir `src/services/bankilyService.ts` |
| Build / distribution | EAS (`eas.json`) — profils `dev`, `staging`, `prod` |

### Point d'attention — Expo Go non supporté

Le projet utilise le SDK **natif** `@react-native-firebase` (et non le SDK JS web), ainsi qu'un client de développement (`expo-dev-client`). **L'app ne peut donc pas tourner dans Expo Go** — il faut un *development build* (natif) pour lancer le projet en local. Les dossiers `ios/` et `android/` sont générés (non versionnés, voir `.gitignore`) via `expo prebuild`.

---

## Prérequis

- [Node.js](https://nodejs.org/) v18+
- npm v9+
- Pour iOS : macOS + Xcode (avec CocoaPods)
- Pour Android : Android Studio + un SDK/émulateur configuré (ou un appareil physique en mode debug USB)
- Un accès aux projets Firebase du dépôt (dev / staging / prod) pour récupérer les fichiers de config natifs et les variables d'environnement
- [EAS CLI](https://docs.expo.dev/eas/) si tu dois builder via le cloud : `npm install -g eas-cli`

---

## 1. Installation

```bash
cd mobile
npm install
```

## 2. Configuration Firebase (fichiers natifs)

Le projet a besoin des fichiers de config natifs Firebase, non versionnés dans certains cas — demande-les à l'équipe si absents :

- `GoogleService-Info.plist` (iOS) à la racine de `mobile/`
- `google-services.json` (Android) à la racine de `mobile/`

## 3. Variables d'environnement

Le projet utilise trois environnements : `dev`, `staging`, `prod`. Chacun a son propre fichier `.env.<env>`, jamais commité (secrets Firebase).

```bash
cp .env.example .env.dev
# puis .env.staging et .env.prod si besoin
```

Remplis les valeurs `EXPO_PUBLIC_FIREBASE_*` depuis la console Firebase du projet correspondant (**Paramètres du projet → Vos applications → SDK Firebase**).

Au lancement, `scripts/set-env.js` copie automatiquement `.env.<env>` → `.env` (lu par Expo et injecté dans `app.config.js`) — pas besoin de le faire à la main.

---

## 4. Lancer l'application

### Premier lancement (génère les projets natifs + installe l'app sur simulateur/appareil)

```bash
npx expo prebuild        # génère ios/ et android/ à partir de app.config.js
npx expo run:ios         # ou : npx expo run:android
```

### Lancements suivants (Metro + client déjà installé)

```bash
npm run dev              # démarre Metro en env "dev"
npm run dev:ios          # démarre Metro + build/lance sur simulateur iOS
npm run dev:android      # démarre Metro + build/lance sur émulateur Android
```

Une fois Metro lancé, ouvre l'app **de développement** déjà installée sur ton simulateur/appareil (pas Expo Go) — elle se connecte automatiquement au bundler.

### Autres environnements

```bash
npm run staging          # / staging:ios / staging:android
npm run prod             # / prod:ios
```

### Web (support partiel via react-native-web)

```bash
npm run web
```

---

## 5. Build & distribution (EAS)

```bash
eas build --profile dev --platform ios       # build interne, client de dev
eas build --profile staging --platform android
eas build --profile prod --platform ios      # build store
```

Les profils (`dev`, `staging`, `prod`) sont définis dans `eas.json` et pilotent la variable `APP_ENV`, elle-même utilisée par `app.config.js` pour choisir le nom de l'app, le bundle ID et le package Android.

---

## Structure du projet

```
mobile/
├── app/                    # Routes (Expo Router, file-based)
│   ├── (auth)/              # Login, register, vérification OTP
│   └── (app)/                # Écrans post-connexion
├── src/
│   ├── components/          # UI, investment, project
│   ├── hooks/                # useAuthStore, useProjects, useMyInvestments...
│   ├── services/             # authService, projectService, investmentService,
│   │                          # bankilyService, kycService, firebase.ts
│   ├── utils/                # Génération PDF (contrats), format, partage
│   ├── i18n/                 # fr / ar
│   ├── constants/
│   └── types/
├── scripts/set-env.js       # Bascule .env.<env> → .env
├── app.config.js            # Config Expo dynamique (dépend de APP_ENV)
└── eas.json                 # Profils de build EAS
```

---

## Dépannage

- **Crash au démarrage sur Android (`SIGSEGV` dans `libworklets.so`)** : vérifier que `babel.config.js` contient bien le plugin `react-native-reanimated/plugin`, et que les versions de `react-native-gesture-handler` (`~2.32.0`), `react-native-reanimated` (`4.5.0`) et `react-native-worklets` (`0.10.0`) correspondent exactement à celles attendues par le SDK Expo installé. Utiliser `npx expo install <package>` plutôt qu'un `npm install` direct pour rester sur la bonne version.
- **Erreur Firebase au lancement** : vérifier la présence de `.env` (généré depuis `.env.<env>` par `scripts/set-env.js`) et des fichiers `GoogleService-Info.plist` / `google-services.json`.
