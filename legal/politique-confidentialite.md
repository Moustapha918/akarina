# Politique de confidentialité — Osool

**Dernière mise à jour : [À COMPLÉTER — date de publication]**

La présente politique de confidentialité décrit comment Osool SARL (« Osool », « nous ») collecte, utilise, partage et protège les données personnelles des utilisateurs de l'application mobile Osool (« l'Application ») et de ses services associés.

En créant un compte ou en utilisant l'Application, vous acceptez les pratiques décrites dans ce document.

---

## 1. Qui sommes-nous

Osool SARL, société à responsabilité limitée de droit mauritanien, enregistrée au registre de commerce de Nouakchott, Mauritanie, est responsable du traitement des données personnelles collectées via l'Application.

**Contact** : [À COMPLÉTER — adresse e-mail de contact, ex. contact@osool.mr]
**Adresse** : [À COMPLÉTER — adresse du siège social]

Osool exploite une plateforme de financement participatif immobilier permettant à des investisseurs de co-financer des projets immobiliers en Mauritanie via des contrats de partenariat Mousharaka (conformes aux principes de la finance islamique).

## 2. Données que nous collectons

### 2.1 Données fournies directement par vous

| Donnée | Quand | Pourquoi |
|---|---|---|
| Nom complet | Inscription | Identification, contrats |
| Numéro de téléphone (+222…) | Inscription | Connexion (code SMS), identification, contact |
| Adresse e-mail | Inscription | Communication, reçus |
| Pièce d'identité (carte d'identité ou passeport, scan/photo) | Vérification KYC | Obligation réglementaire de vérification d'identité avant investissement |
| Numéro Bankily utilisé pour le paiement | Lors d'un investissement | Traitement du paiement via Bankily (B-PAY) |

**Important** : Osool ne collecte jamais votre code PIN Bankily ni le passcode B-PAY que vous saisissez dans l'application Bankily — ces informations restent entre vous et Bankily. Nous recevons uniquement une confirmation de transaction (référence, statut) de la part de Bankily.

### 2.2 Données générées par votre utilisation

- Historique de vos investissements (montant, projet, statut, date).
- Statut de vérification KYC (en attente / vérifié / rejeté).
- Contrats de partenariat générés (PDF), horodatage de leur acceptation.
- Préférence de langue de l'application.

### 2.3 Données techniques

- Données d'authentification gérées par Firebase Authentication (jeton de session).
- Aucune donnée de géolocalisation précise n'est collectée.
- L'Application n'intègre pas d'outil d'analyse d'audience ni de publicité tierce à ce jour.

## 3. Pourquoi nous utilisons vos données

- **Créer et gérer votre compte**, vous authentifier par code SMS.
- **Vérifier votre identité (KYC)**, obligation réglementaire préalable à tout investissement au-delà d'un certain seuil.
- **Traiter vos investissements et paiements**, générer et vous transmettre vos contrats de partenariat Mousharaka.
- **Assurer le suivi de vos investissements** (dashboard, portfolio, actualités des projets).
- **Assurer le support client** et répondre à vos demandes.
- **Prévenir la fraude** et assurer la sécurité de la plateforme.
- **Respecter nos obligations légales et réglementaires**, notamment en matière de lutte contre le blanchiment de capitaux.

## 4. Avec qui nous partageons vos données

Nous ne vendons jamais vos données personnelles. Nous les partageons uniquement avec :

- **Bankily / BPM** : pour le traitement des paiements que vous initiez (numéro de téléphone Bankily, montant, référence d'opération).
- **Google Firebase / Google Cloud Platform** : notre infrastructure d'hébergement (authentification, base de données, stockage des documents et contrats, fonctions serveur). Ces prestataires traitent les données en tant que sous-traitants, selon leurs propres engagements de sécurité.
- **Personnel autorisé d'Osool SARL** : accès limité aux données strictement nécessaires à la vérification KYC et au support client.
- **Autorités compétentes** : si la loi mauritanienne l'exige (obligations comptables, lutte anti-blanchiment, réquisition judiciaire).

## 5. Durée de conservation

Nous conservons vos données personnelles :
- Pendant toute la durée de votre compte actif.
- Après clôture de votre compte, pendant la durée nécessaire au respect de nos obligations légales et comptables (documents contractuels et relatifs aux transactions financières notamment).

Les documents d'identité KYC sont conservés selon les mêmes principes et supprimés lorsqu'ils ne sont plus nécessaires à ces fins.

## 6. Sécurité de vos données

- Les communications entre l'Application et nos serveurs sont chiffrées (HTTPS/TLS).
- L'accès à vos données en base est restreint par des règles de sécurité strictes : seul le titulaire du compte (ou un administrateur autorisé) peut lire ou modifier ses propres données.
- Les identifiants marchand utilisés pour dialoguer avec Bankily ne sont jamais exposés côté application mobile ; les appels sensibles transitent uniquement par nos fonctions serveur.
- Aucun système n'étant infaillible, nous ne pouvons garantir une sécurité absolue, mais nous mettons en œuvre les mesures raisonnables pour protéger vos données.

## 7. Vos droits

Sous réserve de la réglementation applicable, vous disposez d'un droit d'accès, de rectification et de suppression de vos données personnelles, ainsi que d'un droit d'opposition à certains traitements. La suppression peut être limitée par nos obligations légales de conservation (documents comptables, KYC, lutte anti-blanchiment).

Pour exercer ces droits, contactez-nous à : [À COMPLÉTER — adresse e-mail de contact].

## 8. Âge minimum

L'Application est destinée aux personnes ayant atteint la majorité légale en Mauritanie. Nous ne collectons pas sciemment de données concernant des mineurs.

## 9. Modifications de cette politique

Nous pouvons mettre à jour cette politique de confidentialité. Toute modification substantielle vous sera communiquée via l'Application. La date de dernière mise à jour figure en haut de ce document.

## 10. Contact

Pour toute question relative à cette politique ou à vos données personnelles :
[À COMPLÉTER — adresse e-mail de contact]

---

**Note interne (à retirer avant publication)** : ce document est un premier brouillon rédigé à partir des données réellement collectées par l'application (voir `mobile/src/types/index.ts`, `mobile/src/services/`). Il doit être relu par un professionnel du droit avant publication, notamment pour confirmer sa conformité à la réglementation mauritanienne applicable (protection des données, lutte anti-blanchiment) et compléter les champs `[À COMPLÉTER]`.
