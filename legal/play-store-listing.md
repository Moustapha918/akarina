# Contenu Play Console — Osool

## Description courte (max 80 caractères)

```
Faire vos investissemnt dans l'immobilier mauritanien, paiement Bankily.
```
(78 caractères)

## Description complète (max 4000 caractères)

```
Osool est la première plateforme facilitant l'achat immobilier en Mauritanie. Investissez, dès un petit montant, dans des projets immobiliers sélectionnés — construction ou achat-revente de terrain — aux côtés d'autres investisseurs.

COMMENT ÇA MARCHE
• Parcourez des projets immobiliers vérifiés à Nouakchott et ailleurs en Mauritanie
• Choisissez votre montant de premiere mensualité
• Signez un contrat, conforme aux principes de la finance islamique
• Payez simplement via Bankily (B-PAY)
• Suivez l'avancement de votre projet depuis votre tableau de bord


SUIVI EN TEMPS RÉEL
Consultez à tout moment l'avancement de vos mensialité/paiments, les photos et actualités du chantier, et l'historique de vos paiments.

SÉCURISÉ ET VÉRIFIÉ
Une vérification d'identité (KYC) est requise au-delà d'un certain seuil d'investissement, pour la sécurité de tous les investisseurs.

Osool s'adresse aux résidents mauritaniens comme à la diaspora souhaitant investir dans l'immobilier de leur pays, en toute simplicité, depuis leur téléphone.
```
(≈1350 caractères — large marge sous la limite de 4000)

## Catégorie suggérée
**Finance**

## Coordonnées de contact (à compléter avec vos vraies infos)
- E-mail : `contact@akarina.net`
- Site web (optionnel) : `https://akarina.net`
- Politique de confidentialité : https://github.com/Moustapha918/osool-privacy-policy/blob/main/politique-confidentialite.md

---

# Formulaire "Sécurité des données" (Data safety)

À remplir dans Play Console → Contenu de l'app → Sécurité des données. Basé sur les données réellement collectées (`mobile/src/types/index.ts`, `mobile/src/services/`).

**L'app collecte-t-elle ou partage-t-elle des données utilisateur ?** → Oui

| Catégorie | Type de donnée | Collectée | Partagée | Finalité |
|---|---|---|---|---|
| Infos personnelles | Nom | Oui | Non | Fonctionnalité de l'app |
| Infos personnelles | Adresse e-mail | Oui | Non | Fonctionnalité de l'app, communication |
| Infos personnelles | Numéro de téléphone | Oui | Non | Fonctionnalité de l'app (authentification SMS) |
| Photos | Photos (pièce d'identité KYC) | Oui | Non | Vérification d'identité réglementaire |
| Infos financières | Infos de paiement (référence de transaction Bankily, montants investis) | Oui | Oui* | Traitement des paiements |
| Infos financières | Historique d'achats/investissements | Oui | Non | Fonctionnalité de l'app |

\* Partagée uniquement avec **Bankily/BPM**, en tant que prestataire de traitement du paiement que l'utilisateur initie lui-même — pas de partage à des fins publicitaires ou de revente.

**Catégories à cocher "non collecté" :** Localisation, Messages, Contacts, Calendrier, Fichiers et documents (autres que les contrats PDF générés, stockés pour l'utilisateur lui-même), Identifiants d'appareil, Journaux d'application/diagnostics, Activité dans l'app (aucun SDK analytics/publicité intégré).

**Sécurité des données :**
- Données chiffrées en transit → **Oui** (HTTPS/TLS, Firebase)
- L'utilisateur peut demander la suppression de ses données → **Oui** (sous réserve des obligations légales de conservation — cf. politique de confidentialité)

**Toutes les données sont-elles chiffrées en transit ?** → Oui

---

# Accès de test pour les reviewers Google (App access)

Play Console → Contenu de l'app → Accès à l'app. L'app nécessite une connexion (téléphone + code SMS), donc il faut fournir des identifiants de test.

**Instructions à coller :**
```
Cette application utilise une authentification par numéro de téléphone + code SMS (Firebase Authentication).

Pour tester sans recevoir de SMS réel, un numéro de test a été configuré dans Firebase :
Numéro : [à compléter après configuration du numéro de test Firebase]
Code OTP fixe : [à compléter]

Aucune autre action n'est nécessaire pour accéder aux fonctionnalités principales (parcourir les projets, simuler un investissement).
```

**Étape préalable requise** : configurer un numéro de test dans Firebase Console (`akarina-bf84b` → Authentication → Sign-in method → Téléphone → "Numéros de téléphone pour les tests") avant de pouvoir compléter les deux derniers champs ci-dessus.
