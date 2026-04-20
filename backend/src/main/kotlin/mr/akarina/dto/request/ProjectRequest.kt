package mr.akarina.dto.request

import jakarta.validation.constraints.DecimalMin
import jakarta.validation.constraints.Min
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.NotNull
import mr.akarina.domain.entity.ProjectStatus
import java.math.BigDecimal

data class ProjectRequest(
    @field:NotBlank
    val title: String,

    @field:NotBlank
    val description: String,

    @field:NotBlank
    val location: String,

    @field:NotNull
    @field:DecimalMin("100000.00")
    val targetAmount: BigDecimal,

    @field:NotNull
    @field:DecimalMin("0.00")
    val roiEstimate: BigDecimal,

    @field:Min(1)
    val maxInvestors: Int = 200,

    @field:NotNull
    @field:DecimalMin("1000.00")
    val minInvestmentAmount: BigDecimal,

    val status: ProjectStatus = ProjectStatus.OPEN,
    val coverImageUrl: String? = null,
)
