package mr.akarina.dto.request

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.NotNull
import java.math.BigDecimal

data class InvestmentRequest(
    @field:NotNull
    val projectId: Long,

    @field:NotNull
    @field:DecimalMin(value = "1000.00", message = "Le montant minimum d'investissement est 1 000 MRU")
    val amount: BigDecimal,

    /** L'investisseur a accepté les termes du contrat Mousharaka */
    val contractAccepted: Boolean = false,
)
