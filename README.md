# Akarina — منصة التمويل العقاري التشاركي

Plateforme de financement participatif immobilier en Mauritanie, basée sur des contrats de partenariat **Mousharaka** (finance islamique, Sharia-compliant).

---

## Concept

Une SARL unique gère l'ensemble des projets immobiliers. Les investisseurs (locaux et diaspora mauritanienne) souscrivent à des **parts de projets spécifiques** via des contrats numériques générés automatiquement. Le paiement est effectué via **Bankily** (BPM Mauritanie).

---

## Stack technique

| Couche | Technologie |
|---|---|
| Backend | Kotlin · Spring Boot 3.4 · Spring Security (JWT) · Spring Data JPA |
| Base de données | PostgreSQL 16 |
| Frontend | Angular 20 · Tailwind CSS · TypeScript |
| Paiement | API Bankily (mode simulation inclus) |
| Génération PDF | OpenPDF 1.3 (contrats Mousharaka) |
| Documentation API | Swagger UI (springdoc-openapi) |

---

## Prérequis

- **Java 21+** — `java -version`
- **Node.js 20+** et **npm** — `node -v`
- **Docker & Docker Compose** (optionnel, pour le lancement conteneurisé)
- **PostgreSQL 16** (uniquement pour le lancement local sans Docker)

---

## Lancement de l'application

### Option A — Local (sans Docker)

#### 1. Créer la base de données PostgreSQL

```bash
psql -U postgres -c "CREATE USER akarina WITH PASSWORD 'akarina_secret';"
psql -U postgres -c "CREATE DATABASE akarina_db OWNER akarina;"
```

#### 2. Lancer le backend

```bash
cd backend
./gradlew bootRun --args='--spring.profiles.active=local'
```

Le profil `local` active :
- `ddl-auto: create-drop` (le schéma est recréé automatiquement)
- Les logs SQL Hibernate
- Le stockage des fichiers dans `~/akarina-local/`

L'API est disponible sur : **http://localhost:8080/api**

#### 3. Lancer le frontend

```bash
cd frontend
npm install
ng serve
```

L'interface est disponible sur : **http://localhost:4200**

---

### Option B — Docker Compose (recommandé)

Lance PostgreSQL, le backend et le frontend en une seule commande.

```bash
docker compose up --build
```

| Service | URL |
|---|---|
| Frontend | http://localhost:4200 |
| Backend API | http://localhost:8080/api |
| Swagger UI | http://localhost:8080/api/swagger-ui.html |
| PostgreSQL | localhost:5432 |

Pour arrêter :

```bash
docker compose down
```

Pour repartir de zéro (supprime les volumes) :

```bash
docker compose down -v
```

---

## Documentation de l'API

Swagger UI est disponible après démarrage du backend :

```
http://localhost:8080/api/swagger-ui.html
```

Tous les endpoints protégés nécessitent un header `Authorization: Bearer <token>` obtenu via `/api/auth/login`.

### Endpoints principaux

| Méthode | Route | Accès | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Inscription investisseur |
| `POST` | `/auth/login` | Public | Connexion, retourne le JWT |
| `GET` | `/projects` | Public | Liste paginée des projets |
| `GET` | `/projects/{id}` | Public | Détail d'un projet |
| `POST` | `/investments` | Authentifié | Initier un investissement |
| `GET` | `/investments/portfolio` | Authentifié | Portefeuille de l'investisseur |
| `POST` | `/kyc/upload` | Authentifié | Upload de pièce d'identité |
| `GET` | `/dashboard/investor` | Authentifié | Vue investisseur |
| `GET` | `/dashboard/admin/stats` | Admin | Statistiques globales |
| `POST` | `/projects` | Admin | Créer un projet |
| `GET` | `/kyc/pending` | Admin | Documents KYC en attente |
| `POST` | `/bankily/simulate` | Public (dev) | Simuler un webhook de paiement |

---

## Tunnel d'investissement

```
1. Sélection du projet  →  GET /projects/{id}
2. Saisie du montant    →  validation côté front (min, max, statut OPEN)
3. Acceptation contrat  →  checkbox Mousharaka obligatoire
4. Initiation paiement  →  POST /investments  →  Bankily Push OTP
5. Confirmation webhook →  POST /bankily/webhook  →  génération PDF contrat
6. Contrat disponible   →  GET /investments/portfolio
```

En mode simulation, l'étape 5 peut être déclenchée manuellement :

```bash
curl -X POST "http://localhost:8080/api/bankily/simulate?bankilyRef=BNK_XXX&status=SUCCESS&amount=50000"
```

---

## Structure du projet

```
akarina/
├── backend/                        # Spring Boot / Kotlin
│   └── src/main/kotlin/mr/akarina/
│       ├── config/                 # Security, OpenAPI, JPA, ExceptionHandler
│       ├── controller/             # AuthController, ProjectController, ...
│       ├── domain/entity/          # User, Project, Investment, Document
│       ├── dto/                    # Request / Response DTOs
│       ├── repository/             # Spring Data JPA repositories
│       ├── security/               # JWT provider + filtre
│       └── service/                # AuthService, InvestmentService, PdfContractService, ...
│
├── frontend/                       # Angular 20 / Tailwind CSS
│   └── src/app/
│       ├── core/                   # Models, Services, Guards, Interceptors
│       └── features/
│           ├── auth/               # Login / Register
│           ├── catalog/            # Liste projets + Détail
│           ├── invest/             # Tunnel d'investissement (4 étapes)
│           ├── dashboard/          # Vue investisseur + Back-office admin
│           └── kyc/                # Upload document d'identité
│
└── docker-compose.yml
```

---

## Variables d'environnement

Les valeurs par défaut permettent de démarrer sans configuration. En production, surcharger via des variables d'environnement :

| Variable | Description | Défaut |
|---|---|---|
| `DB_USERNAME` | Utilisateur PostgreSQL | `akarina` |
| `DB_PASSWORD` | Mot de passe PostgreSQL | `akarina_secret` |
| `JWT_SECRET` | Clé de signature JWT (min. 64 chars) | *(valeur de dev incluse)* |
| `KYC_UPLOAD_DIR` | Répertoire de stockage des documents | `/var/akarina/kyc` |
| `CONTRACT_OUTPUT_DIR` | Répertoire des contrats PDF générés | `/var/akarina/contracts` |
| `BANKILY_MERCHANT_ID` | Identifiant marchand Bankily | `MOCK_MERCHANT` |
| `BANKILY_API_KEY` | Clé API Bankily | `MOCK_API_KEY` |
| `BANKILY_WEBHOOK_SECRET` | Secret HMAC pour validation webhook | `MOCK_WEBHOOK_SECRET` |
# Akarina Platform
