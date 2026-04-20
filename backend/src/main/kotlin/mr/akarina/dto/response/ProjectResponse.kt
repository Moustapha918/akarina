package mr.akarina.dto.response

import mr.akarina.domain.entity.Project
import mr.akarina.domain.entity.ProjectStatus
import java.math.BigDecimal
import java.time.Instant

data class ProjectResponse(
    val id: Long,
    val title: String,
    val description: String,
    val location: String,
    val targetAmount: BigDecimal,
    val collectedAmount: BigDecimal,
    val remainingAmount: BigDecimal,
    val fundingPercentage: Double,
    val roiEstimate: BigDecimal,
    val status: ProjectStatus,
    val maxInvestors: Int,
    val minInvestmentAmount: BigDecimal,
    val coverImageUrl: String?,
    val photoUrls: List<String>,
    val investorCount: Long,
    val createdAt: Instant,
) {
    companion object {
        fun from(project: Project, investorCount: Long = 0): ProjectResponse = ProjectResponse(
            id = project.id,
            title = project.title,
            description = project.description,
            location = project.location,
            targetAmount = project.targetAmount,
            collectedAmount = project.collectedAmount,
            remainingAmount = project.remainingAmount,
            fundingPercentage = project.fundingPercentage,
            roiEstimate = project.roiEstimate,
            status = project.status,
            maxInvestors = project.maxInvestors,
            minInvestmentAmount = project.minInvestmentAmount,
            coverImageUrl = project.coverImageUrl,
            photoUrls = project.photoUrls?.split(",")?.map { it.trim() }?.filter { it.isNotEmpty() } ?: emptyList(),
            investorCount = investorCount,
            createdAt = project.createdAt,
        )
    }
}
