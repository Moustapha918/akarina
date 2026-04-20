package mr.akarina.service

import mr.akarina.domain.entity.Investment
import mr.akarina.domain.entity.PaymentStatus
import mr.akarina.domain.entity.ProjectStatus
import mr.akarina.dto.request.InvestmentRequest
import mr.akarina.dto.response.InvestmentResponse
import mr.akarina.dto.response.PaymentInitResponse
import mr.akarina.dto.response.PortfolioResponse
import mr.akarina.repository.InvestmentRepository
import mr.akarina.repository.ProjectRepository
import mr.akarina.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.scheduling.annotation.Scheduled
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.Instant
import java.time.temporal.ChronoUnit

@Service
class InvestmentService(
    private val investmentRepository: InvestmentRepository,
    private val projectRepository: ProjectRepository,
    private val userRepository: UserRepository,
    private val bankilyService: BankilyService,
    private val pdfContractService: PdfContractService,
) {
    private val log = LoggerFactory.getLogger(InvestmentService::class.java)

    /**
     * Étape 1 du tunnel d'investissement :
     * Valide les conditions, crée un lock temporaire (15 min) et initie le paiement Bankily.
     */
    @Transactional
    fun initiateInvestment(userId: Long, request: InvestmentRequest): PaymentInitResponse {
        check(request.contractAccepted) {
            "Vous devez accepter les termes du contrat de partenariat Mousharaka."
        }

        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("Utilisateur introuvable.") }

        val project = projectRepository.findById(request.projectId)
            .orElseThrow { NoSuchElementException("Projet introuvable: ${request.projectId}") }

        check(project.status == ProjectStatus.OPEN) {
            "Ce projet n'est plus ouvert aux investissements (statut: ${project.status})."
        }
        check(request.amount >= project.minInvestmentAmount) {
            "Montant minimum: ${project.minInvestmentAmount} MRU."
        }
        check(request.amount <= project.remainingAmount) {
            "Le montant dépasse le capital restant à collecter (${project.remainingAmount} MRU)."
        }

        val investorCount = investmentRepository.countSuccessfulInvestorsByProjectId(project.id)
        check(investorCount < project.maxInvestors) {
            "Ce projet a atteint son nombre maximum d'investisseurs (${project.maxInvestors})."
        }

        val lockExpiry = Instant.now().plus(15, ChronoUnit.MINUTES)
        val paymentResult = bankilyService.initiatePayment(user.phone, request.amount, "INV-${userId}-${project.id}")

        val investment = investmentRepository.save(
            Investment(
                user = user,
                project = project,
                amount = request.amount,
                bankilyRef = paymentResult.bankilyRef,
                bankilySessionToken = paymentResult.sessionToken,
                paymentStatus = PaymentStatus.PENDING,
                lockExpiresAt = lockExpiry,
            )
        )

        // Lock optimiste : réserve le montant sur le projet pendant le paiement
        project.collectedAmount = project.collectedAmount.add(request.amount)
        projectRepository.save(project)

        return PaymentInitResponse(
            investmentId = investment.id,
            bankilySessionToken = paymentResult.sessionToken,
            lockExpiresAt = lockExpiry,
            message = paymentResult.message,
        )
    }

    /**
     * Étape 2 : Traitement du webhook Bankily.
     * Appelé par BankilyWebhookController après vérification de la signature.
     */
    @Transactional
    fun processPaymentConfirmation(bankilyRef: String, status: String, amount: BigDecimal) {
        val investment = investmentRepository.findByBankilyRef(bankilyRef)
            ?: run {
                log.warn("Webhook reçu pour une référence inconnue: $bankilyRef")
                return
            }

        if (investment.paymentStatus != PaymentStatus.PENDING) {
            log.warn("Investissement ${investment.id} déjà traité (statut: ${investment.paymentStatus}). Ignoré.")
            return
        }

        when (status.uppercase()) {
            "SUCCESS" -> confirmSuccess(investment)
            "FAILED" -> confirmFailure(investment)
            else -> log.error("Statut Bankily inconnu: $status pour ref $bankilyRef")
        }
    }

    private fun confirmSuccess(investment: Investment) {
        investment.paymentStatus = PaymentStatus.SUCCESS
        investment.lockExpiresAt = null

        val contractUrl = pdfContractService.generateContract(investment)
        investment.contractUrl = contractUrl

        investmentRepository.save(investment)

        // Finalise le montant collecté (déjà ajouté en lock, rien à faire ici)
        log.info("Investissement ${investment.id} confirmé. Contrat généré: $contractUrl")
    }

    private fun confirmFailure(investment: Investment) {
        investment.paymentStatus = PaymentStatus.FAILED

        // Libère le montant réservé sur le projet
        val project = investment.project
        project.collectedAmount = (project.collectedAmount - investment.amount)
            .coerceAtLeast(BigDecimal.ZERO)
        projectRepository.save(project)

        investmentRepository.save(investment)
        log.warn("Paiement échoué pour l'investissement ${investment.id}.")
    }

    /** Libère les locks expirés toutes les 5 minutes. */
    @Scheduled(fixedDelay = 300_000)
    @Transactional
    fun releaseExpiredLocks() {
        val expired = investmentRepository.findAllByPaymentStatusAndLockExpiresAtBefore(
            PaymentStatus.PENDING, Instant.now()
        )
        expired.forEach { investment ->
            log.info("Lock expiré — libération investissement ${investment.id}")
            confirmFailure(investment.also { it.paymentStatus = PaymentStatus.EXPIRED })
        }
    }

    @Transactional(readOnly = true)
    fun getPortfolio(userId: Long): PortfolioResponse {
        val investments = investmentRepository.findAllByUserId(userId)
            .filter { it.paymentStatus == PaymentStatus.SUCCESS }
        return PortfolioResponse(
            totalInvested = investments.sumOf { it.amount },
            activeInvestments = investments.size,
            investments = investments.map { InvestmentResponse.from(it) },
        )
    }

    @Transactional(readOnly = true)
    fun getUserInvestments(userId: Long): List<InvestmentResponse> =
        investmentRepository.findAllByUserId(userId).map { InvestmentResponse.from(it) }
}
