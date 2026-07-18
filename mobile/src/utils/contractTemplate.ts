import { User, Project } from '../types';
import { formatMRU } from './format';

/**
 * Génère le HTML du contrat de partenariat Mousharaka.
 * Utilisé avec expo-print pour produire un PDF signable.
 */
export function generateContractHTML(
  user: User,
  project: Project,
  amount: number
): string {
  const today = new Date().toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const sharePercent = ((amount / project.targetAmount) * 100).toFixed(2);
  const estimatedReturn = Math.round(amount * (project.roiEstimate / 100));

  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Helvetica Neue', Arial, sans-serif;
      font-size: 12px;
      line-height: 1.7;
      color: #1C2833;
      padding: 40px 48px;
    }
    .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1B4F72; padding-bottom: 16px; }
    .logo { font-size: 28px; font-weight: 800; color: #1B4F72; letter-spacing: 2px; }
    .doc-title { font-size: 16px; font-weight: 700; color: #1B4F72; margin-top: 8px; text-transform: uppercase; }
    .doc-subtitle { font-size: 11px; color: #717D7E; margin-top: 4px; }
    h2 {
      font-size: 12px;
      font-weight: 700;
      color: #1B4F72;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 8px;
      padding-bottom: 4px;
      border-bottom: 1px solid #D5D8DC;
    }
    .parties-grid { display: flex; gap: 16px; margin: 12px 0; }
    .party-box {
      flex: 1;
      background: #F8F9FA;
      border: 1px solid #D5D8DC;
      border-radius: 8px;
      padding: 14px;
    }
    .party-box h3 { font-size: 11px; color: #717D7E; margin-bottom: 8px; text-transform: uppercase; }
    .party-box p { font-size: 12px; line-height: 1.8; }
    .amount-banner {
      background: linear-gradient(135deg, #1B4F72, #2E86C1);
      border-radius: 12px;
      padding: 20px;
      text-align: center;
      margin: 16px 0;
      color: white;
    }
    .amount-banner .label { font-size: 11px; opacity: 0.8; margin-bottom: 4px; }
    .amount-banner .value { font-size: 28px; font-weight: 800; }
    .amount-banner .sub { font-size: 11px; opacity: 0.8; margin-top: 4px; }
    .meta-grid { display: flex; gap: 12px; margin: 12px 0; }
    .meta-item {
      flex: 1;
      background: #EBF5FB;
      border-radius: 8px;
      padding: 10px 12px;
      text-align: center;
    }
    .meta-item .meta-label { font-size: 10px; color: #717D7E; }
    .meta-item .meta-value { font-size: 13px; font-weight: 700; color: #1B4F72; margin-top: 2px; }
    .clause { margin-bottom: 10px; }
    .clause strong { color: #1B4F72; }
    .signatures {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      gap: 32px;
    }
    .sig-block { flex: 1; text-align: center; }
    .sig-title { font-size: 11px; color: #717D7E; margin-bottom: 40px; }
    .sig-line { border-top: 1px solid #1C2833; padding-top: 8px; font-size: 12px; }
    .footer {
      margin-top: 32px;
      padding-top: 12px;
      border-top: 1px solid #D5D8DC;
      font-size: 10px;
      color: #ABB2B9;
      text-align: center;
    }
    .ref-badge {
      display: inline-block;
      background: #F8F9FA;
      border: 1px solid #D5D8DC;
      border-radius: 4px;
      padding: 4px 10px;
      font-family: monospace;
      font-size: 11px;
      color: #1B4F72;
      margin-top: 8px;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="logo">AKARINA</div>
    <div class="doc-title">Contrat de Partenariat Mousharaka</div>
    <div class="doc-subtitle">Conforme aux principes de la Finance Islamique (Sharia) · Droit mauritanien</div>
  </div>

  <h2>Parties Contractantes</h2>
  <div class="parties-grid">
    <div class="party-box">
      <h3>La Société Gérante</h3>
      <p>
        <strong>Akarina SARL</strong><br>
        Société à Responsabilité Limitée<br>
        Registre de commerce : Mauritanie<br>
        Siège : Nouakchott, Mauritanie
      </p>
    </div>
    <div class="party-box">
      <h3>L'Associé Investisseur</h3>
      <p>
        <strong>${user.name}</strong><br>
        Tél : ${user.phone}<br>
        Email : ${user.email}
      </p>
    </div>
  </div>

  <h2>Objet du Partenariat</h2>
  <p class="clause">
    Ce contrat définit les termes d'un partenariat de type <strong>Mousharaka</strong> pour le
    co-financement du projet immobilier <strong>"${project.title}"</strong>, situé à
    <strong>${project.location}</strong>, Mauritanie.
  </p>

  <div class="amount-banner">
    <div class="label">Participation de l'associé</div>
    <div class="value">${formatMRU(amount)}</div>
    <div class="sub">Retour estimé : +${formatMRU(estimatedReturn)} en ${project.roiDurationMonths} mois</div>
  </div>

  <div class="meta-grid">
    <div class="meta-item">
      <div class="meta-label">Part du projet</div>
      <div class="meta-value">${sharePercent}%</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">ROI estimé</div>
      <div class="meta-value">${project.roiEstimate}%</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Durée</div>
      <div class="meta-value">${project.roiDurationMonths} mois</div>
    </div>
    <div class="meta-item">
      <div class="meta-label">Objectif projet</div>
      <div class="meta-value">${formatMRU(project.targetAmount, true)}</div>
    </div>
  </div>

  <h2>Clauses du Contrat</h2>

  <p class="clause">
    <strong>Art. 1 – Nature Sharia-compliant :</strong> Ce partenariat est de type Mousharaka,
    approuvé selon les principes de la finance islamique. Aucun intérêt (Riba) n'est appliqué.
    Les profits sont partagés selon les parts de capital ; les pertes éventuelles sont supportées
    à proportion des apports.
  </p>

  <p class="clause">
    <strong>Art. 2 – Utilisation exclusive des fonds :</strong> Les fonds versés sont
    exclusivement dédiés au financement du projet mentionné. Aucun détournement ni activité
    prohibée (Haram) n'est autorisé.
  </p>

  <p class="clause">
    <strong>Art. 3 – Retour sur investissement :</strong> Le taux de retour de
    <strong>${project.roiEstimate}%</strong> sur <strong>${project.roiDurationMonths} mois</strong>
    est une estimation basée sur les études de marché immobilier mauritanien. Il ne constitue pas
    une garantie contractuelle de rendement.
  </p>

  <p class="clause">
    <strong>Art. 4 – Transparence et reporting :</strong> L'associé a accès en temps réel via
    l'application Akarina aux rapports d'avancement du chantier (photos, vidéos, jalons).
  </p>

  <p class="clause">
    <strong>Art. 5 – Gouvernance :</strong> Akarina SARL assure la gestion opérationnelle du
    projet. L'associé n'intervient pas dans les décisions de gestion courante mais est informé
    de toute décision majeure affectant sa participation.
  </p>

  <p class="clause">
    <strong>Art. 6 – Liquidité :</strong> La participation n'est pas librement cessible avant
    l'achèvement du projet, sauf accord exprès d'Akarina SARL ou mécanisme de marché secondaire
    mis en place ultérieurement.
  </p>

  <p class="clause">
    <strong>Art. 7 – Droit applicable :</strong> Ce contrat est régi par le droit mauritanien
    et les principes de la finance islamique. Tout litige sera soumis aux juridictions compétentes
    de Nouakchott.
  </p>

  <h2>Date et Signatures</h2>
  <p>Fait à Nouakchott, le <strong>${today}</strong></p>
  <div class="signatures">
    <div class="sig-block">
      <div class="sig-title">Pour Akarina SARL</div>
      <div class="sig-line">Le Gérant</div>
    </div>
    <div class="sig-block">
      <div class="sig-title">L'Associé Investisseur</div>
      <div class="sig-line">${user.name}</div>
    </div>
  </div>

  <div class="footer">
    <p>Document généré le ${today} via l'application Akarina.</p>
    <p>Ce contrat est juridiquement contraignant selon la législation mauritanienne.</p>
  </div>

</body>
</html>
  `.trim();
}
