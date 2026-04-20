package mr.akarina.service

import mr.akarina.domain.entity.User
import mr.akarina.domain.entity.UserRole
import mr.akarina.dto.request.LoginRequest
import mr.akarina.dto.request.RegisterRequest
import mr.akarina.dto.response.AuthResponse
import mr.akarina.repository.UserRepository
import mr.akarina.security.JwtTokenProvider
import org.springframework.security.crypto.password.PasswordEncoder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class AuthService(
    private val userRepository: UserRepository,
    private val passwordEncoder: PasswordEncoder,
    private val jwtTokenProvider: JwtTokenProvider,
) {
    @Transactional
    fun register(request: RegisterRequest): AuthResponse {
        check(!userRepository.existsByEmail(request.email)) {
            "Un compte avec cet email existe déjà."
        }
        check(!userRepository.existsByPhone(request.phone)) {
            "Un compte avec ce numéro de téléphone existe déjà."
        }

        val user = userRepository.save(
            User(
                fullName = request.fullName,
                email = request.email,
                phone = request.phone,
                passwordHash = passwordEncoder.encode(request.password),
                role = UserRole.INVESTOR,
            )
        )
        return buildAuthResponse(user)
    }

    @Transactional(readOnly = true)
    fun login(request: LoginRequest): AuthResponse {
        val user = userRepository.findByEmail(request.email)
            .orElseThrow { IllegalArgumentException("Email ou mot de passe incorrect.") }

        check(user.isActive) { "Ce compte a été désactivé. Contactez l'administrateur." }
        check(passwordEncoder.matches(request.password, user.passwordHash)) {
            "Email ou mot de passe incorrect."
        }

        return buildAuthResponse(user)
    }

    private fun buildAuthResponse(user: User): AuthResponse = AuthResponse(
        token = jwtTokenProvider.generateToken(user.id, user.email, user.role),
        userId = user.id,
        fullName = user.fullName,
        email = user.email,
        role = user.role,
        kycStatus = user.kycStatus,
    )
}
