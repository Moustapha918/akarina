package mr.akarina.repository

import mr.akarina.domain.entity.Investment
import mr.akarina.domain.entity.PaymentStatus
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.Instant

@Repository
interface InvestmentRepository : JpaRepository<Investment, Long> {
    fun findAllByUserId(userId: Long): List<Investment>
    fun findAllByProjectId(projectId: Long): List<Investment>
    fun findByBankilyRef(bankilyRef: String): Investment?
    fun findAllByPaymentStatus(status: PaymentStatus): List<Investment>

    /** Libère les locks expirés (appelé par un scheduler) */
    fun findAllByPaymentStatusAndLockExpiresAtBefore(
        status: PaymentStatus,
        now: Instant
    ): List<Investment>

    @Query("SELECT COALESCE(SUM(i.amount), 0) FROM Investment i WHERE i.project.id = :projectId AND i.paymentStatus = 'SUCCESS'")
    fun sumSuccessfulAmountByProjectId(projectId: Long): BigDecimal

    @Query("SELECT COUNT(i) FROM Investment i WHERE i.project.id = :projectId AND i.paymentStatus = 'SUCCESS'")
    fun countSuccessfulInvestorsByProjectId(projectId: Long): Long
}
