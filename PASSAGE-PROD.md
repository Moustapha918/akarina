# Passage DEV → PROD

Ce document décrit la procédure pour basculer l'app mobile (et l'admin) de l'environnement Firebase **dev** (`akarina-bf84b`) vers l'environnement **prod** (`osool-prod`).

**Ne pas exécuter avant que les deux conditions suivantes soient remplies :**
1. L'app a été publiée sur le Play Store (et idéalement l'App Store) en pointant encore sur `dev`.
2. Le parcours complet a été testé en conditions réelles sur `dev` (inscription, investissement, paiement Bankily sandbox, contrat PDF, dashboard).

Tant que ces deux conditions ne sont pas remplies, le mobile reste branché sur `dev` — c'est l'état actuel et volontaire du repo.

---

## 1. Ce qui est déjà prêt côté infra (`osool-prod`)

Fait lors de la création du projet prod (voir historique) :

- Projet Firebase **`osool-prod`** créé, alias `prod` dans `.firebaserc`.
- 3 apps enregistrées : iOS + Android (`mr.akarina.app`) + Web.
- Firestore (Native/Standard) + Storage activés, règles et index déployés (`firestore.rules`, `firestore.indexes.json`, `storage.rules` — mêmes fichiers que dev, aucune adaptation nécessaire, ils sont project-agnostic).
- Les 8 Cloud Functions déployées en `europe-west1` : `initiateBankilyPayment`, `checkBankilyTransaction`, `cancelInvestment`, `reconcileBankilyPayments`, `syncAdminClaim`, `getProjectsFundingStats`, `listFeatureFlags`, `setFeatureFlag`.
- Secrets Bankily **production** (pas sandbox) posés dans Secret Manager : `BANKILY_BASE_URL`, `BANKILY_USERNAME`, `BANKILY_PASSWORD`, `BANKILY_CLIENT_ID`.
- Politique de nettoyage Artifact Registry configurée (europe-west1).
- Fichiers de config générés et présents dans `mobile/` : `.env.prod`, `GoogleService-Info.prod.plist`, `google-services.prod.json`.

**À vérifier avant le passage** (pas confirmé à 100% lors de la création) :
- [ ] Firebase Auth → provider **Téléphone** bien activé sur `osool-prod` (console → Authentication → Sign-in method).
- [ ] Plan **Blaze** actif sur `osool-prod` (console → Usage and billing).
- [ ] Sauvegarde Firestore planifiée mise en place sur `osool-prod` (absente par défaut, recommandé avant d'avoir des vraies données utilisateurs).

## 2. Écart connu à combler côté code mobile

`mobile/app.config.js` pointe **actuellement vers un seul jeu de fichiers Google Services partagé**, quel que soit `APP_ENV` :

```js
ios: {
  googleServicesFile: './GoogleService-Info.plist',   // toujours le même fichier
},
android: {
  googleServicesFile: './google-services.json',       // toujours le même fichier
},
```

Il faudra le faire pointer vers le bon fichier selon l'environnement avant de pouvoir builder une version prod fonctionnelle. Deux options :

**Option A — fichiers par environnement (recommandé)**
```js
ios: {
  googleServicesFile: APP_ENV === 'prod'
    ? './GoogleService-Info.prod.plist'
    : './GoogleService-Info.plist',
},
android: {
  googleServicesFile: APP_ENV === 'prod'
    ? './google-services.prod.json'
    : './google-services.json',
},
```
Les fichiers `GoogleService-Info.prod.plist` et `google-services.prod.json` existent déjà dans `mobile/` (générés lors de la création du projet prod) — il ne reste qu'à brancher la logique ci-dessus.

**Option B — remplacer purement et simplement** les fichiers `GoogleService-Info.plist`/`google-services.json` par les versions prod au moment du build release, et les restaurer après (plus manuel, plus risqué, déconseillé).

## 3. Procédure de passage (mobile)

1. **Combler l'écart de la section 2** (une fois, pas à refaire à chaque build).
2. Vérifier `mobile/.env.prod` (déjà présent) — recopier si besoin depuis `.env.example` en cas de rotation de clés API.
3. Build local de test :
   ```bash
   cd mobile
   npm run prod:ios        # ou prod:android si le script existe
   ```
   Ça copie `.env.prod` → `.env` et lance Expo avec `APP_ENV=prod`.
4. Build de release via EAS (profil `prod` déjà défini dans `eas.json`) :
   ```bash
   eas build --profile prod --platform ios
   eas build --profile prod --platform android
   ```
5. **Test de bout en bout obligatoire avant soumission aux stores** : inscription, investissement, paiement Bankily réel (petit montant), génération du contrat PDF, dashboard — sur le build prod, contre `osool-prod`.
6. Soumettre le nouveau build aux stores (App Store Connect / Play Console) — remplace le build dev existant.

## 4. Procédure de passage (admin Angular)

L'admin n'a aujourd'hui qu'un seul `environment.ts`, pas de séparation dev/prod. À faire avant le passage :

1. Créer `admin/src/environments/environment.prod.ts` avec la config Firebase de `osool-prod` (mêmes valeurs que `mobile/.env.prod`, transposées au format Angular — voir `admin/src/environments/environment.ts` pour le format).
2. Ajouter les `fileReplacements` dans `admin/angular.json` (section `build.configurations.production`) pour que `ng build --configuration production` utilise `environment.prod.ts`.
3. Décider d'une cible de déploiement (rien n'est configuré aujourd'hui — ni Firebase Hosting, ni ailleurs).

## 5. Rollback

Revenir sur `dev` à tout moment ne casse rien côté infra (le projet `osool-prod` reste actif en parallèle) :
```bash
cd mobile
npm run dev:ios     # ou dev:android
```
Aucune donnée n'est partagée entre les deux projets Firebase — dev et prod sont complètement isolés (bases Firestore, comptes Auth, Storage, secrets Bankily tous distincts).

## 6. Commandes de référence

```bash
# Vérifier l'état des Cloud Functions prod
firebase functions:list --project osool-prod

# Vérifier un secret (n'affiche que la valeur, pas de liste des noms)
firebase functions:secrets:access BANKILY_BASE_URL --project osool-prod

# Redéployer les règles/index si modifiées
firebase deploy --only firestore:rules,firestore:indexes,storage --project osool-prod

# Redéployer les functions si le code change
firebase deploy --only functions --project osool-prod
```

**Toujours vérifier `--project osool-prod` (ou `--project akarina-bf84b` pour dev) sur chaque commande Firebase CLI** — il n'y a pas d'alias "actif" fiable par défaut sur cette machine, mieux vaut être explicite à chaque fois.
