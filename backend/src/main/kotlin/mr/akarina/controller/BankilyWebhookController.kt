package mr.akarina.controller

import mr.akarina.service.BankilyService
import mr.akarina.service.InvestmentService
import org.slf4j.LoggerFactory
import org.springframework.http.ResponseEntity
import org.springframework.web.bind.annotation.*
import java.math.BigDecimal

@RestController
@RequestMapping("/bankily")
class BankilyWebhookController(
    private val bankilyService: BankilyService,
    private val investmentService: InvestmentService,
) {
    private val log = LoggerFactory.getLogger(BankilyWebhookController::class.java)

    /**
     * Point de réception du webhook Bankily.
     * Bankily envoie un POST avec les données de confirmation du paiement.
     *
     * En production, la signature X-Bankily-Signature doit être vérifiée.
     */
    @PostMapping("/webhook")
    fun handleWebhook(
        @RequestBody payload: Map<String, Any>,
        @RequestHeader(value = "X-Bankily-Signature", required = false) signature: String?,
    ): ResponseEntity<Map<String, String>> {
        log.info("Webhook Bankily reçu: $payload")

        val rawPayload = payload.entries.joinToString("&") { "${it.key}=${it.value}" }
        if (!bankilyService.verifyWebhookSignature(rawPayload, signature ?: "")) {
            log.warn("Signature webhook invalide — requête rejetée")
            return ResponseEntity.status(403).body(mapOf("error" to "Signature invalide"))
        }

        val bankilyRef = payload["reference"]?.toString()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "Champ 'reference' manquant"))

        val status = payload["status"]?.toString()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "Champ 'status' manquant"))

        val amount = payload["amount"]?.toString()?.toBigDecimalOrNull()
            ?: return ResponseEntity.badRequest().body(mapOf("error" to "Champ 'amount' invalide"))

        investmentService.processPaymentConfirmation(bankilyRef, status, amount)

        return ResponseEntity.ok(mapOf("message" to "Webhook traité avec succès"))
    }

    /**
     * Endpoint de simulation uniquement — permet de tester le flux complet en dev.
     * À supprimer ou sécuriser en production.
     */
    @PostMapping("/simulate")
    fun simulateWebhook(
        @RequestParam bankilyRef: String,
        @RequestParam status: String = "SUCCESS",
        @RequestParam amount: BigDecimal,
    ): ResponseEntity<Map<String, String>> {
        log.warn("[SIMULATION] Déclenchement manuel du webhook pour ref=$bankilyRef")
        investmentService.processPaymentConfirmation(bankilyRef, status, amount)
        return ResponseEntity.ok(mapOf("message" to "Simulation traitée: $status"))
    }
}
