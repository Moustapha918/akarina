package mr.akarina.dto.response

import mr.akarina.domain.entity.KycStatus
import mr.akarina.domain.entity.UserRole

data class AuthResponse(
    val token: String,
    val userId: Long,
    val fullName: String,
    val email: String,
    val role: UserRole,
    val kycStatus: KycStatus,
)
