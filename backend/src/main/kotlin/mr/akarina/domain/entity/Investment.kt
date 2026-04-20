package mr.akarina.domain.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.math.BigDecimal
import java.time.Instant

enum class PaymentStatus { PENDING, SUCCESS, FAILED, EXPIRED }

@Entity
@Table(name = "investments")
@EntityListeners(AuditingEntityListener::class)
class Investment(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "project_id", nullable = false)
    val project: Project,

    /**
     * Montant investi en MRU — immuable après création
     */
    @Column(nullable = false, precision = 20, scale = 2)
    val amount: BigDecimal,

    /**
     * Référence de transaction retournée par Bankily
     */
    @Column(unique = true)
    var bankilyRef: String? = null,

    /**
     * OTP / session token Bankily pour la confirmation de paiement
     */
    @Column
    var bankilySessionToken: String? = null,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var paymentStatus: PaymentStatus = PaymentStatus.PENDING,

    /**
     * URL du contrat PDF généré après paiement SUCCESS
     */
    @Column
    var contractUrl: String? = null,

    /**
     * Horodatage du lock temporaire (expire après 15 minutes)
     */
    @Column
    var lockExpiresAt: Instant? = null,

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @LastModifiedDate
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    val isLocked: Boolean
        get() = paymentStatus == PaymentStatus.PENDING && lockExpiresAt?.isAfter(Instant.now()) == true

    /** Part en pourcentage de la propriété du projet */
    val ownershipShare: BigDecimal
        get() = if (project.targetAmount > BigDecimal.ZERO)
            amount.divide(project.targetAmount, 6, java.math.RoundingMode.HALF_UP)
                .multiply(BigDecimal("100"))
        else BigDecimal.ZERO
}
