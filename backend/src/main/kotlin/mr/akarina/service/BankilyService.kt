package mr.akarina.service

import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import java.math.BigDecimal
import java.util.UUID

/**
 * Service d'intégration Bankily (BPM Mauritanie).
 *
 * En mode simulation (akarina.bankily.simulation-mode=true), les appels vers
 * l'API réelle sont remplacés par des réponses mockées. Remplacer les méthodes
 * privées par des appels HTTP réels lors de l'intégration en production.
 */
@Service
class BankilyService(
    @Value("\${akarina.bankily.merchant-id}") private val merchantId: String,
    @Value("\${akarina.bankily.api-key}") private val apiKey: String,
    @Value("\${akarina.bankily.webhook-secret}") private val webhookSecret: String,
    @Value("\${akarina.bankily.simulation-mode}") private val simulationMode: Boolean,
) {
    private val log = LoggerFactory.getLogger(BankilyService::class.java)

    data class PaymentInitResult(
        val sessionToken: String,
        val bankilyRef: String,
        val message: String,
    )

    data class WebhookPayload(
        val bankilyRef: String,
        val status: String,           // "SUCCESS" | "FAILED"
        val amount: BigDecimal,
        val phoneNumber: String,
        val signature: String,
    )

    /**
     * Initie un paiement Push Bankily — envoie un OTP sur le mobile de l'investisseur.
     *
     * @param phoneNumber  Numéro Mauritanien (+222XXXXXXXX)
     * @param amount       Montant en MRU
     * @param reference    Référence interne Akarina
     */
    fun initiatePayment(phoneNumber: String, amount: BigDecimal, reference: String): PaymentInitResult {
        return if (simulationMode) simulateInitPayment(phoneNumber, amount, reference)
        else realInitPayment(phoneNumber, amount, reference)
    }

    /**
     * Vérifie la signature HMAC du webhook entrant pour s'assurer de l'authenticité.
     */
    fun verifyWebhookSignature(payload: String, signature: String): Boolean {
        if (simulationMode) return true
        val expected = computeHmacSha256(payload, webhookSecret)
        return expected.equals(signature, ignoreCase = true)
    }

    // ── Simulation ─────────────────────────────────────────────────────────

    private fun simulateInitPayment(phone: String, amount: BigDecimal, reference: String): PaymentInitResult {
        log.info("[BANKILY SIMULATION] Initiation paiement — phone=$phone, amount=$amount MRU, ref=$reference")
        return PaymentInitResult(
            sessionToken = "SIM_SESSION_${UUID.randomUUID()}",
            bankilyRef = "BNK_${UUID.randomUUID().toString().uppercase().take(12)}",
            message = "[SIMULATION] OTP envoyé sur $phone. Utilisez le webhook /bankily/webhook pour confirmer.",
        )
    }

    // ── Production (à implémenter) ──────────────────────────────────────────

    private fun realInitPayment(phone: String, amount: BigDecimal, reference: String): PaymentInitResult {
        // TODO: Implémenter l'appel HTTP réel vers l'API Bankily BPM
        // POST https://api.bankily.mr/v1/payment/push
        // Headers: Authorization: Bearer $apiKey, X-Merchant-Id: $merchantId
        // Body: { phoneNumber, amount, currency: "MRU", reference }
        throw UnsupportedOperationException("Intégration Bankily réelle non encore configurée. Passez en mode simulation.")
    }

    private fun computeHmacSha256(data: String, key: String): String {
        val mac = javax.crypto.Mac.getInstance("HmacSHA256")
        mac.init(javax.crypto.spec.SecretKeySpec(key.toByteArray(), "HmacSHA256"))
        return mac.doFinal(data.toByteArray()).joinToString("") { "%02x".format(it) }
    }
}
