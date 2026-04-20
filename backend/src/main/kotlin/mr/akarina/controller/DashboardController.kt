package mr.akarina.controller

import mr.akarina.domain.entity.KycStatus
import mr.akarina.domain.entity.ProjectStatus
import mr.akarina.dto.response.PortfolioResponse
import mr.akarina.repository.InvestmentRepository
import mr.akarina.repository.ProjectRepository
import mr.akarina.repository.UserRepository
import mr.akarina.security.AkarinaUserPrincipal
import mr.akarina.service.InvestmentService
import org.springframework.data.domain.Pageable
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/dashboard")
class DashboardController(
    private val investmentService: InvestmentService,
    private val userRepository: UserRepository,
    private val projectRepository: ProjectRepository,
    private val investmentRepository: InvestmentRepository,
) {
    /** Vue investisseur — portefeuille et résumé */
    @GetMapping("/investor")
    fun investorDashboard(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
    ): PortfolioResponse = investmentService.getPortfolio(principal.userId)

    /** Vue admin — statistiques globales de la plateforme */
    @GetMapping("/admin/stats")
    @PreAuthorize("hasRole('ADMIN')")
    fun adminStats(): Map<String, Any> {
        val totalUsers = userRepository.count()
        val verifiedUsers = userRepository.findAllByKycStatus(KycStatus.VERIFIED).size
        val pendingKyc = userRepository.findAllByKycStatus(KycStatus.SUBMITTED).size
        val totalProjects = projectRepository.count()
        val openProjects = projectRepository.findAllByStatus(ProjectStatus.OPEN, Pageable.unpaged()).totalElements

        return mapOf(
            "totalUsers" to totalUsers,
            "verifiedInvestors" to verifiedUsers,
            "pendingKycValidations" to pendingKyc,
            "totalProjects" to totalProjects,
            "openProjects" to openProjects,
        )
    }

    /** Vue admin — liste des utilisateurs */
    @GetMapping("/admin/users")
    @PreAuthorize("hasRole('ADMIN')")
    fun listUsers() = userRepository.findAll().map { user ->
        mapOf(
            "id" to user.id,
            "fullName" to user.fullName,
            "email" to user.email,
            "phone" to user.phone,
            "role" to user.role,
            "kycStatus" to user.kycStatus,
            "isActive" to user.isActive,
            "createdAt" to user.createdAt,
        )
    }
}
