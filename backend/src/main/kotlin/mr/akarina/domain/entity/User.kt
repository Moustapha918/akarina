package mr.akarina.domain.entity

import jakarta.persistence.*
import jakarta.validation.constraints.Email
import jakarta.validation.constraints.Pattern
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant

enum class UserRole { INVESTOR, ADMIN }
enum class KycStatus { PENDING, SUBMITTED, VERIFIED, REJECTED }

@Entity
@Table(name = "users")
@EntityListeners(AuditingEntityListener::class)
class User(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var fullName: String,

    @Column(nullable = false, unique = true)
    @Email
    var email: String,

    /**
     * Mauritanian phone format: +222 XXXX XXXX (8 digits after country code)
     */
    @Column(nullable = false, unique = true)
    @Pattern(regexp = "^\\+222[234679]\\d{7}$", message = "Numéro de téléphone mauritanien invalide (format: +222XXXXXXXX)")
    var phone: String,

    @Column(nullable = false)
    var passwordHash: String,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var role: UserRole = UserRole.INVESTOR,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var kycStatus: KycStatus = KycStatus.PENDING,

    @Column(nullable = false)
    var isActive: Boolean = true,

    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val investments: MutableList<Investment> = mutableListOf(),

    @OneToMany(mappedBy = "user", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val documents: MutableList<Document> = mutableListOf(),

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @LastModifiedDate
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
)
