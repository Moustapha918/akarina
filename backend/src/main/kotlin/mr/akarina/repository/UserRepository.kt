package mr.akarina.repository

import mr.akarina.domain.entity.KycStatus
import mr.akarina.domain.entity.User
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository
import java.util.Optional

@Repository
interface UserRepository : JpaRepository<User, Long> {
    fun findByEmail(email: String): Optional<User>
    fun findByPhone(phone: String): Optional<User>
    fun existsByEmail(email: String): Boolean
    fun existsByPhone(phone: String): Boolean
    fun findAllByKycStatus(kycStatus: KycStatus): List<User>
}
