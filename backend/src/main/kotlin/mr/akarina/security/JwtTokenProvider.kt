package mr.akarina.security

import io.jsonwebtoken.JwtException
import io.jsonwebtoken.Jwts
import io.jsonwebtoken.security.Keys
import mr.akarina.domain.entity.UserRole
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Component
import java.util.Date
import javax.crypto.SecretKey

@Component
class JwtTokenProvider(
    @Value("\${akarina.jwt.secret}") private val jwtSecret: String,
    @Value("\${akarina.jwt.expiration-ms}") private val jwtExpirationMs: Long,
) {
    private val signingKey: SecretKey by lazy {
        Keys.hmacShaKeyFor(jwtSecret.toByteArray())
    }

    fun generateToken(userId: Long, email: String, role: UserRole): String =
        Jwts.builder()
            .subject(email)
            .claim("userId", userId)
            .claim("role", role.name)
            .issuedAt(Date())
            .expiration(Date(System.currentTimeMillis() + jwtExpirationMs))
            .signWith(signingKey)
            .compact()

    fun validateToken(token: String): Boolean = runCatching {
        Jwts.parser().verifyWith(signingKey).build().parseSignedClaims(token)
        true
    }.getOrDefault(false)

    fun getEmailFromToken(token: String): String =
        Jwts.parser().verifyWith(signingKey).build()
            .parseSignedClaims(token).payload.subject

    fun getUserIdFromToken(token: String): Long =
        (Jwts.parser().verifyWith(signingKey).build()
            .parseSignedClaims(token).payload["userId"] as Int).toLong()

    fun getRoleFromToken(token: String): String =
        Jwts.parser().verifyWith(signingKey).build()
            .parseSignedClaims(token).payload["role"] as String
}
