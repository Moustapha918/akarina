# Agent Context: Akarina Crowdfund Platform

## 1. Vision & Business Logic
* **Concept:** Plateforme de financement participatif immobilier en Mauritanie.
* **Structure Juridique:** Une seule SARL gère l'ensemble des projets pour réduire la lourdeur administrative.
* **Modèle d'Investissement:** Contrat de **Mousharaka** (Partenariat Sharia-compliant).
* **Cible:** Locaux et Diaspora mauritanienne.
* **Contrainte:** Nombre d'investisseurs illimité par plateforme, mais projets segmentés par groupes (ex: 200 personnes max par projet pour la lisibilité).

## 2. Tech Stack
* **Backend:** typescript expo
* **Database:** firebase
* **Frontend:** react native
* **Paiement:** Intégration API Bankily (BPM) - Flux B2B (Push/Pull/Webhook)
* **Documents:** Génération de contrats PDF

## 3. Data Model (Core Entities)
* **User:** Id, Name, Email, Phone (format +222), Role (INVESTOR, ADMIN), KYC_Status.
* **Project:** Id, Title, Description, Location, Target_Amount, Collected_Amount, ROI_Estimate, Status (OPEN, FUNDED, CONSTRUCTION, COMPLETED).
* **Investment:** Id, User_Id, Project_Id, Amount, Bankily_Ref, Status (PENDING, SUCCESS, FAILED), Contract_URL.
* **Document:** Id, User_Id, Doc_Type (ID_CARD, CONTRACT), File_Path, Is_Verified.

## 4. Key Functional Requirements (MVP)

### A. Tunnel d'Investissement (Simplicité style)
 un tunel d'investissement doit etre fait avec une expertise UX/UI pour maximiser la chance d'accrocher un nouveau client sur plusieurs etape: 
1. Sélection du projet -> Choix du montant.
2. Acceptation du contrat (Checkbox) -> Génération du contrat temporaire.
3. Déclenchement paiement Bankily via API (Push OTP sur mobile).
4. Webhook de confirmation -> Update statut Investment -> Génération PDF final.

### B. Automatisation KYC
* Upload de pièce d'identité (Front-end).
* Validation côté Admin (Back-office).
* Restriction : Seuls les utilisateurs "VERIFIED" peuvent investir au-delà d'un certain seuil.

### C. Reporting & Transparence
* Dashboard investisseur : Liste des projets détenus + Evolution du chantier.
* Flux de photos/vidéos par projet (Actualités).

## 5. Implementation Rules for AI Assistant
* **Code Style:** Clean Code, SOLID principles, DTOs pour les échanges API.
* **Security:** * Toutes les routes `/api/admin/**` doivent être protégées par le rôle ADMIN.
    * Validation stricte des montants.
    * Sanitisation des fichiers uploadés.
* **Bankily Simulation:** Créer un `BankilyService` avec une méthode `initiatePayment` et un endpoint de `callback` (Webhook) simulant la réponse de la banque.
* **Contract Service:** Créer un service utilisant un template HTML pour générer le PDF du contrat de partenariat.

## 6. Development Roadmap (3 Months)
* **Month 1:** Base structure, Auth, Project Discovery API.
* **Month 2:** Bankily Integration, Investment Logic, PDF Generation.
* **Month 3:** Investor Dashboard, Admin Back-office, Mobile Optimization.

---
*Note: Toujours prioriser la simplicité d'utilisation (Mobile-First) et la robustesse du suivi financier.*