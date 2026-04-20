package mr.akarina.service

import com.lowagie.text.*
import com.lowagie.text.pdf.PdfPCell
import com.lowagie.text.pdf.PdfPTable
import com.lowagie.text.pdf.PdfWriter
import com.lowagie.text.pdf.draw.LineSeparator
import mr.akarina.domain.entity.Investment
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.awt.Color
import java.io.FileOutputStream
import java.nio.file.Files
import java.nio.file.Paths
import java.time.LocalDate
import java.time.format.DateTimeFormatter
import java.util.Locale

/**
 * Génère un contrat de partenariat Mousharaka en PDF via OpenPDF (programmatique).
 */
@Service
class PdfContractService(
    @Value("\${akarina.contract.output-dir}") private val outputDir: String,
) {
    private val brandGreen = Color(26, 95, 60)
    private val lightGreen = Color(240, 247, 243)
    private val dateFormatter = DateTimeFormatter.ofPattern("dd MMMM yyyy", Locale.FRENCH)

    fun generateContract(investment: Investment): String {
        val outputPath = Paths.get(outputDir)
        Files.createDirectories(outputPath)
        val fileName = "contrat_mousharaka_${investment.id}_${System.currentTimeMillis()}.pdf"
        buildPdf(investment, outputPath.resolve(fileName).toString())
        return "/contracts/$fileName"
    }

    private fun buildPdf(investment: Investment, path: String) {
        val document = Document(PageSize.A4, 50f, 50f, 60f, 60f)
        val writer = PdfWriter.getInstance(document, FileOutputStream(path))
        document.open()

        // ── Fonts ──────────────────────────────────────────────────────────
        val titleFont   = FontFactory.getFont(FontFactory.TIMES_BOLD, 18f, brandGreen)
        val headingFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 13f, brandGreen)
        val bodyFont    = FontFactory.getFont(FontFactory.TIMES, 11f, Color.DARK_GRAY)
        val boldFont    = FontFactory.getFont(FontFactory.TIMES_BOLD, 11f, Color.DARK_GRAY)
        val bigAmountFont = FontFactory.getFont(FontFactory.TIMES_BOLD, 20f, brandGreen)
        val smallGray   = FontFactory.getFont(FontFactory.HELVETICA, 8f, Color.GRAY)

        val today = LocalDate.now().format(dateFormatter)
        val ownershipPct = String.format("%.4f", investment.ownershipShare)

        // ── Header ─────────────────────────────────────────────────────────
        document.add(Paragraph("AKARINA — منصة التمويل العقاري التشاركي", titleFont).apply { alignment = Element.ALIGN_CENTER })
        document.add(Paragraph("Plateforme de Financement Participatif Immobilier en Mauritanie", bodyFont).apply { alignment = Element.ALIGN_CENTER })
        document.add(Paragraph("CONTRAT DE PARTENARIAT MOUSHARAKA", boldFont).apply { alignment = Element.ALIGN_CENTER; spacingBefore = 6f })
        document.add(Paragraph("Conforme aux principes de la finance islamique — Sharia-compliant", smallGray).apply { alignment = Element.ALIGN_CENTER })

        addSeparator(document, brandGreen)

        document.add(Paragraph(
            "Référence: AKARINA-CNTR-${investment.id}  |  Date: $today  |  Réf. paiement: ${investment.bankilyRef ?: "N/A"}",
            smallGray
        ).apply { alignment = Element.ALIGN_RIGHT; spacingAfter = 10f })

        // ── Article 1 — Parties ────────────────────────────────────────────
        document.add(section("Article 1 — Identification des Parties", headingFont))
        document.add(Paragraph("1.1. La Société Gestionnaire (Rab Al-Mal) :", boldFont))
        document.add(infoTable(listOf(
            "Dénomination sociale" to "AKARINA SARL",
            "Registre de Commerce" to "RC-MR-XXXX-2024",
            "Adresse" to "Tevragh Zeina, Nouakchott, Mauritanie",
        ), bodyFont, boldFont))

        document.add(Paragraph("1.2. L'Investisseur (Sharik) :", boldFont).apply { spacingBefore = 8f })
        document.add(infoTable(listOf(
            "Nom complet" to investment.user.fullName,
            "Email" to investment.user.email,
            "Téléphone" to investment.user.phone,
        ), bodyFont, boldFont))

        // ── Article 2 — Projet ─────────────────────────────────────────────
        document.add(section("Article 2 — Objet du Contrat et Projet Immobilier", headingFont))
        document.add(infoTable(listOf(
            "Nom du projet" to investment.project.title,
            "Localisation" to investment.project.location,
            "ROI annuel estimé" to "${investment.project.roiEstimate}%",
        ), bodyFont, boldFont))

        // ── Article 3 — Montant ────────────────────────────────────────────
        document.add(section("Article 3 — Montant et Part de Propriété", headingFont))

        val amountTable = PdfPTable(1).apply { widthPercentage = 100f; setSpacingBefore(4f); setSpacingAfter(8f) }
        val amountCell = PdfPCell().apply {
            setBackgroundColor(lightGreen)
            setBorderColor(brandGreen)
            setBorderWidth(1.5f)
            setPadding(12f)
            addElement(Paragraph("Montant investi :", bodyFont))
            addElement(Paragraph("${investment.amount.toPlainString()} MRU", bigAmountFont))
            addElement(Paragraph("Part de propriété : $ownershipPct% du projet « ${investment.project.title} »", boldFont))
        }
        amountTable.addCell(amountCell)
        document.add(amountTable)

        // ── Article 4 — Conditions ─────────────────────────────────────────
        document.add(section("Article 4 — Conditions de Partenariat", headingFont))
        listOf(
            "4.1. Nature du contrat : Le présent contrat est un contrat de Mousharaka Mutanakissa (partenariat décroissant) conforme aux principes de la finance islamique. Il ne comporte aucun intérêt (Riba) et les profits/pertes sont partagés proportionnellement aux apports de chaque partie.",
            "4.2. Distribution des bénéfices : Les bénéfices générés par le projet (loyers, plus-values) seront distribués aux investisseurs proportionnellement à leur part de propriété, selon les modalités définies dans le prospectus du projet.",
            "4.3. Durée : Le partenariat prend effet à la date de signature et reste valable jusqu'à la liquidation du projet ou le rachat de la part par AKARINA SARL selon les conditions convenues.",
            "4.4. Risques : L'investisseur reconnaît que l'investissement immobilier comporte des risques inhérents et que le ROI annoncé est une estimation non garantie. En cas de perte, elle est supportée proportionnellement par toutes les parties.",
        ).forEach { text ->
            document.add(Paragraph(text, bodyFont).apply { alignment = Element.ALIGN_JUSTIFIED; spacingAfter = 6f })
        }

        // ── Article 5 — Signatures ─────────────────────────────────────────
        document.add(section("Article 5 — Signatures", headingFont))
        document.add(Paragraph(
            "En acceptant le présent contrat via la plateforme Akarina, les deux parties déclarent avoir lu, compris et accepté l'intégralité des termes ci-dessus.",
            bodyFont
        ).apply { alignment = Element.ALIGN_JUSTIFIED })

        document.add(Paragraph(" "))

        val sigTable = PdfPTable(3).apply { widthPercentage = 100f; setSpacingBefore(20f) }
        sigTable.setWidths(floatArrayOf(2f, 0.5f, 2f))

        fun sigCell(name: String, role: String): PdfPCell = PdfPCell().apply {
            border = PdfPCell.TOP
            setBorderColor(Color.DARK_GRAY)
            setPaddingTop(10f)
            addElement(Paragraph(name, boldFont).apply { alignment = Element.ALIGN_CENTER })
            addElement(Paragraph(role, smallGray).apply { alignment = Element.ALIGN_CENTER })
        }
        sigTable.addCell(sigCell("AKARINA SARL", "Le Directeur Général"))
        sigTable.addCell(PdfPCell().apply { border = PdfPCell.NO_BORDER })
        sigTable.addCell(sigCell(investment.user.fullName, "Acceptation numérique le $today"))
        document.add(sigTable)

        // ── Footer ─────────────────────────────────────────────────────────
        addSeparator(document, Color.LIGHT_GRAY)
        document.add(Paragraph(
            "Document généré automatiquement par Akarina — Réf: AKARINA-CNTR-${investment.id} | $today | Bankily: ${investment.bankilyRef ?: "N/A"}",
            smallGray
        ).apply { alignment = Element.ALIGN_CENTER })

        document.close()
        writer.close()
    }

    // ── Helpers ────────────────────────────────────────────────────────────

    private fun section(text: String, font: Font): Paragraph =
        Paragraph(text, font).apply { spacingBefore = 14f; spacingAfter = 6f }

    private fun addSeparator(document: Document, color: Color) {
        val sep = LineSeparator().apply { lineColor = color; lineWidth = 1.5f }
        document.add(Chunk(sep))
        document.add(Paragraph(" "))
    }

    private fun infoTable(rows: List<Pair<String, String>>, bodyFont: Font, boldFont: Font): PdfPTable {
        val table = PdfPTable(2).apply {
            widthPercentage = 100f
            setWidths(floatArrayOf(1.2f, 2.5f))
            setSpacingAfter(6f)
        }
        for ((label, value) in rows) {
            table.addCell(PdfPCell(Phrase(label, boldFont)).apply {
                setBackgroundColor(lightGreen)
                border = PdfPCell.BOTTOM
                setBorderColor(Color.LIGHT_GRAY)
                setPadding(6f)
            })
            table.addCell(PdfPCell(Phrase(value, bodyFont)).apply {
                border = PdfPCell.BOTTOM
                setBorderColor(Color.LIGHT_GRAY)
                setPadding(6f)
            })
        }
        return table
    }
}
