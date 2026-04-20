package mr.akarina.domain.entity

import jakarta.persistence.*
import org.springframework.data.annotation.CreatedDate
import org.springframework.data.jpa.domain.support.AuditingEntityListener
import java.time.Instant

enum class DocumentType { ID_CARD, PASSPORT, CONTRACT, OTHER }
enum class DocumentStatus { PENDING_REVIEW, APPROVED, REJECTED }

@Entity
@Table(name = "documents")
@EntityListeners(AuditingEntityListener::class)
class Document(
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    val id: Long = 0,

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    val user: User,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val docType: DocumentType,

    /**
     * Chemin de stockage du fichier sur le serveur (non exposé au client)
     */
    @Column(nullable = false)
    val filePath: String,

    /**
     * Nom original du fichier (pour l'affichage)
     */
    @Column(nullable = false)
    val originalFileName: String,

    @Column(nullable = false)
    val contentType: String,

    @Column(nullable = false)
    val fileSizeBytes: Long,

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    var status: DocumentStatus = DocumentStatus.PENDING_REVIEW,

    /**
     * Notes de l'admin lors de la validation/rejet
     */
    @Column(columnDefinition = "TEXT")
    var reviewNotes: String? = null,

    @Column
    var reviewedAt: Instant? = null,

    @Column
    var reviewedByAdminId: Long? = null,

    @CreatedDate
    @Column(nullable = false, updatable = false)
    var uploadedAt: Instant = Instant.now(),
)
