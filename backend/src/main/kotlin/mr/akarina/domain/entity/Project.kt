package mr.akarina.domain.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.annotation.LastModifiedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.math.BigDecimal
import java.time.Instant

enum class ProjectStatus { OPEN, FUNDED, CONSTRUCTION, COMPLETED, CANCELLED }

@Entity
@Table(name = "projects")
@EntityListeners(AuditingEntityListener::class)
class Project(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @Column(nullable = false)
    var title: String,

    @Column(nullable = false, columnDefinition = "TEXT")
    var description: String,

    @Column(nullable = false)
    var location: String,

    /**
     * Montant cible en MRU (Ouguiya mauritanien)
     */
    @Column(nullable = false, precision = 20, scale = 2)
    var targetAmount: BigDecimal,

    /**
     * Montant collecté — mis à jour de façon atomique à chaque investissement validé
     */
    @Column(nullable = false, precision = 20, scale = 2)
    var collectedAmount: BigDecimal = BigDecimal.ZERO,

    /**
     * ROI annuel estimé en pourcentage (ex: 12.5 pour 12.5%)
     */
    @Column(nullable = false, precision = 5, scale = 2)
    var roiEstimate: BigDecimal,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: ProjectStatus = ProjectStatus.OPEN,

    /**
     * Nombre maximum d'investisseurs autorisés par projet (lisibilité Mousharaka)
     */
    @Column(nullable = false)
    var maxInvestors: Int = 200,

    /**
     * Montant minimum d'investissement par part
     */
    @Column(nullable = false, precision = 20, scale = 2)
    var minInvestmentAmount: BigDecimal = BigDecimal("10000"),

    /**
     * URLs des photos séparées par virgule (à migrer vers une table dédiée en V2)
     */
    @Column(columnDefinition = "TEXT")
    var photoUrls: String? = null,

    @Column(columnDefinition = "TEXT")
    var coverImageUrl: String? = null,

    @OneToMany(mappedBy = "project", cascade = [CascadeType.ALL], fetch = FetchType.LAZY)
    val investments: MutableList<Investment> = mutableListOf(),

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var createdAt: Instant = Instant.now(),

    @LastModifiedDate
    @Column(nullable = false)
    var updatedAt: Instant = Instant.now(),
) {
    val remainingAmount: BigDecimal
        get() = targetAmount - collectedAmount

    val fundingPercentage: Double
        get() = if (targetAmount > BigDecimal.ZERO)
            (collectedAmount.toDouble() / targetAmount.toDouble() * 100).coerceAtMost(100.0)
        else 0.0
}
