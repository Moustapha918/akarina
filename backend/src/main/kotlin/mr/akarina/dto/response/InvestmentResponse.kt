package mr.akarina.dto.response

import mr.akarina.domain.entity.Investment
import mr.akarina.domain.entity.PaymentStatus
import java.math.BigDecimal
import java.time.Instant

data class InvestmentResponse(
    val id: Long,
    val projectId: Long,
    val projectTitle: String,
    val amount: BigDecimal,
    val ownershipShare: BigDecimal,
    val paymentStatus: PaymentStatus,
    val bankilyRef: String?,
    val contractUrl: String?,
    val createdAt: Instant,
) {
    companion object {
        fun from(investment: Investment): InvestmentResponse = InvestmentResponse(
            id = investment.id,
            projectId = investment.project.id,
            projectTitle = investment.project.title,
            amount = investment.amount,
            ownershipShare = investment.ownershipShare,
            paymentStatus = investment.paymentStatus,
            bankilyRef = investment.bankilyRef,
            contractUrl = investment.contractUrl,
            createdAt = investment.createdAt,
        )
    }
}

data class PortfolioResponse(
    val totalInvested: BigDecimal,
    val activeInvestments: Int,
    val investments: List<InvestmentResponse>,
)

/** Retourné au front lors de l'initiation du paiement */
data class PaymentInitResponse(
    val investmentId: Long,
    val bankilySessionToken: String,
    val lockExpiresAt: Instant,
    val message: String,
)
