import { User, Project } from '../types';
import { formatMRU } from './format';

function buildContractNumber(investmentId: string): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  return `AKR-${yyyy}${mm}${dd}-${investmentId.slice(0, 6).toUpperCase()}`;
}

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.7; color: #1C2833; padding: 40px 48px; }
  .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #1B4F72; padding-bottom: 16px; }
  .logo { font-size: 28px; font-weight: 800; color: #1B4F72; letter-spacing: 2px; }
  .doc-title { font-size: 16px; font-weight: 700; color: #1B4F72; margin-top: 8px; text-transform: uppercase; }
  .doc-subtitle { font-size: 11px; color: #717D7E; margin-top: 4px; }
  .contract-number { display: inline-block; margin-top: 10px; background: #EBF5FB; border: 1px solid #AED6F1; border-radius: 6px; padding: 5px 14px; font-family: monospace; font-size: 13px; font-weight: bold; color: #1B4F72; letter-spacing: 1px; }
  h2 { font-size: 12px; font-weight: 700; color: #1B4F72; text-transform: uppercase; letter-spacing: 1px; margin: 24px 0 8px; padding-bottom: 4px; border-bottom: 1px solid #D5D8DC; }
  .parties-grid { display: flex; gap: 16px; margin: 12px 0; }
  .party-box { flex: 1; background: #F8F9FA; border: 1px solid #D5D8DC; border-radius: 8px; padding: 14px; }
  .party-box h3 { font-size: 11px; color: #717D7E; margin-bottom: 8px; text-transform: uppercase; }
  .party-box p { font-size: 12px; line-height: 1.8; }
  .amount-banner { background: #1B4F72; border-radius: 12px; padding: 20px; text-align: center; margin: 16px 0; color: white; }
  .amount-banner .label { font-size: 11px; opacity: 0.8; margin-bottom: 4px; }
  .amount-banner .value { font-size: 28px; font-weight: 800; }
  .amount-banner .sub { font-size: 11px; opacity: 0.8; margin-top: 4px; }
  .meta-grid { display: flex; gap: 12px; margin: 12px 0; }
  .meta-item { flex: 1; background: #EBF5FB; border-radius: 8px; padding: 10px 12px; text-align: center; }
  .meta-item .meta-label { font-size: 10px; color: #717D7E; }
  .meta-item .meta-value { font-size: 13px; font-weight: 700; color: #1B4F72; margin-top: 2px; }
  .info-box { background: #FEF9E7; border: 1px solid #F9E79F; border-radius: 8px; padding: 12px 16px; margin: 12px 0; font-size: 12px; color: #7D6608; }
  .clause { margin-bottom: 10px; }
  .clause strong { color: #1B4F72; }
  .signatures { display: flex; justify-content: space-between; margin-top: 40px; gap: 32px; }
  .sig-block { flex: 1; text-align: center; }
  .sig-title { font-size: 11px; color: #717D7E; margin-bottom: 40px; }
  .sig-line { border-top: 1px solid #1C2833; padding-top: 8px; font-size: 12px; }
  .footer { margin-top: 32px; padding-top: 12px; border-top: 1px solid #D5D8DC; font-size: 10px; color: #ABB2B9; text-align: center; }
`;

export function generateConstructionContractHTML(
  user: User,
  project: Project,
  amount: number,
  investmentId: string
): string {
  const today = new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' });
  const contractNumber = buildContractNumber(investmentId);
  const sharePercent = ((amount / project.targetAmount) * 100).toFixed(2);
  const isRental = project.exitStrategy === 'RENTAL';

  let returnInfo = '';
  let returnClause = '';

  if (isRental && project.monthlyRent) {
    const investorMonthly = Math.round((amount / project.targetAmount) * project.monthlyRent);
    const investorAnnual = investorMonthly * 12;
    returnInfo = `
      <div class="meta-grid">
        <div class="meta-item">
          <div class="meta-label">Loyer mensuel estimé</div>
          <div class="meta-value">${formatMRU(investorMonthly)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Revenu annuel estimé</div>
          <div class="meta-value">${formatMRU(investorAnnual)}</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Rendement estimé</div>
          <div class="meta-value">${project.roiEstimate}% / an</div>
        </div>
        <div class="meta-item">
          <div class="meta-label">Durée du projet</div>
          <div class="meta-value">${project.roiDurationMonths} mois</div>
        </div>
      </div>
      <div class="info-box">
        ℹ️ Les versements de loyer sont effectués mensuellement par Akarina SARL à proportion de votre participation (${sharePercent}%) sur le loyer total du bien.
      </div>`;
    returnClause = `
      <p class="clause">
        <strong>Art. 3 – Partage des loyers :</strong> Le bien immobilier "${project.title}" est destiné à la location.
        L'associé percevra <strong>${sharePercent}%</strong> du loyer mensuel brut collecté par Akarina SARL,
        soit un revenu mensuel estimé à <strong>${formatMRU(investorMonthly)}</strong> basé sur un loyer total
        mensuel de <strong>${formatMRU(project.monthlyRent)}</strong>. Les versements sont effectués chaque mois
        via le système de paiement Bankily, sous réserve de perception effective des loyers.
      </p>`;
  } else {
    const estimatedReturn = Math.round(amount * (project.roiEstimate / 100));
    returnInfo = `
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
          <div class="meta-label">Plus-value estimée</div>
          <div class="meta-value">+${formatMRU(estimatedReturn, true)}</div>
        </div>
      </div>`;
    returnClause = `
      <p class="clause">
        <strong>Art. 3 – Partage de la plus-value :</strong> À l'issue de la construction et de la vente du bien,
        l'associé percevra <strong>${sharePercent}%</strong> de la plus-value nette réalisée, proportionnellement
        à son apport de <strong>${formatMRU(amount)}</strong>. Le taux de retour estimé est de
        <strong>${project.roiEstimate}%</strong> sur <strong>${project.roiDurationMonths} mois</strong>,
        sans garantie contractuelle de rendement.
      </p>`;
  }

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <style>${BASE_CSS}</style>
</head>
<body>
  <div class="header">
    <div class="logo">AKARINA</div>
    <div class="doc-title">Contrat de Partenariat Mousharaka — Construction</div>
    <div class="doc-subtitle">Conforme aux principes de la Finance Islamique (Sharia) · Droit mauritanien</div>
    <div class="contract-number">N° ${contractNumber}</div>
  </div>

  <h2>Parties Contractantes</h2>
  <div class="parties-grid">
    <div class="party-box">
      <h3>La Société Gérante</h3>
      <p><strong>Akarina SARL</strong><br>Société à Responsabilité Limitée<br>Registre de commerce : Mauritanie<br>Siège : Nouakchott, Mauritanie</p>
    </div>
    <div class="party-box">
      <h3>L'Associé Investisseur</h3>
      <p><strong>${user.name}</strong><br>Tél : ${user.phone}<br>Email : ${user.email}</p>
    </div>
  </div>

  <h2>Objet du Partenariat</h2>
  <p class="clause">
    Partenariat <strong>Mousharaka</strong> pour le co-financement de la construction du bien immobilier
    <strong>"${project.title}"</strong>, situé à <strong>${project.location}</strong>, Mauritanie.
    Stratégie de sortie : <strong>${isRental ? 'Mise en location' : 'Vente à l\'achèvement'}</strong>.
  </p>

  <div class="amount-banner">
    <div class="label">Participation de l'associé</div>
    <div class="value">${formatMRU(amount)}</div>
    <div class="sub">${sharePercent}% du capital total · Objectif projet : ${formatMRU(project.targetAmount, true)}</div>
  </div>

  ${returnInfo}

  <h2>Clauses du Contrat</h2>
  <p class="clause"><strong>Art. 1 – Nature Sharia-compliant :</strong> Ce partenariat est de type Mousharaka. Aucun intérêt (Riba) n'est appliqué. Les profits et pertes sont partagés proportionnellement aux apports.</p>
  <p class="clause"><strong>Art. 2 – Utilisation des fonds :</strong> Les fonds sont exclusivement dédiés à la construction du bien mentionné. Aucune activité prohibée (Haram) n'est autorisée.</p>
  ${returnClause}
  <p class="clause"><strong>Art. 4 – Transparence :</strong> L'associé accède en temps réel via Akarina aux rapports d'avancement (photos, vidéos, jalons financiers).</p>
  <p class="clause"><strong>Art. 5 – Gouvernance :</strong> Akarina SARL assure la gestion opérationnelle. L'associé est informé de toute décision majeure affectant sa participation.</p>
  <p class="clause"><strong>Art. 6 – Liquidité :</strong> La participation n'est pas librement cessible avant l'achèvement du projet, sauf accord exprès d'Akarina SARL.</p>
  <p class="clause"><strong>Art. 7 – Droit applicable :</strong> Ce contrat est régi par le droit mauritanien et les principes de la finance islamique. Tout litige relève des juridictions de Nouakchott.</p>

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
    <p>Contrat N° <strong>${contractNumber}</strong> · Généré le ${today} via l'application Akarina.</p>
    <p>Ce contrat est juridiquement contraignant selon la législation mauritanienne.</p>
  </div>
</body>
</html>`.trim();
}
