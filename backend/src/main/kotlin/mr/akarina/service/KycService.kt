package mr.akarina.service

import mr.akarina.domain.entity.Document
import mr.akarina.domain.entity.DocumentStatus
import mr.akarina.domain.entity.DocumentType
import mr.akarina.domain.entity.KycStatus
import mr.akarina.repository.DocumentRepository
import mr.akarina.repository.UserRepository
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import org.springframework.web.multipart.MultipartFile
import java.nio.file.Files
import java.nio.file.Paths
import java.time.Instant
import java.util.UUID

@Service
class KycService(
    private val documentRepository: DocumentRepository,
    private val userRepository: UserRepository,
    @Value("\${akarina.kyc.upload-dir}") private val uploadDir: String,
    @Value("\${akarina.kyc.allowed-types}") private val allowedTypes: String,
    @Value("\${akarina.kyc.max-size-bytes}") private val maxSizeBytes: Long,
) {
    private val log = LoggerFactory.getLogger(KycService::class.java)
    private val allowed = allowedTypes.split(",").map { it.trim() }

    @Transactional
    fun uploadDocument(userId: Long, docType: DocumentType, file: MultipartFile): Document {
        validateFile(file)

        val user = userRepository.findById(userId)
            .orElseThrow { NoSuchElementException("Utilisateur introuvable.") }

        val uploadPath = Paths.get(uploadDir, userId.toString())
        Files.createDirectories(uploadPath)

        val extension = file.originalFilename?.substringAfterLast('.', "bin") ?: "bin"
        val storedFileName = "${docType.name.lowercase()}_${UUID.randomUUID()}.$extension"
        val targetPath = uploadPath.resolve(storedFileName)

        file.transferTo(targetPath.toFile())

        // Remplace l'ancien document du même type si existant
        documentRepository.findByUserIdAndDocType(userId, docType)?.let {
            deleteFileQuietly(it.filePath)
            documentRepository.delete(it)
        }

        val document = documentRepository.save(
            Document(
                user = user,
                docType = docType,
                filePath = targetPath.toString(),
                originalFileName = file.originalFilename ?: storedFileName,
                contentType = file.contentType ?: "application/octet-stream",
                fileSizeBytes = file.size,
            )
        )

        // Met le statut KYC à SUBMITTED si ce n'est pas encore fait
        if (user.kycStatus == KycStatus.PENDING) {
            user.kycStatus = KycStatus.SUBMITTED
            userRepository.save(user)
        }

        log.info("Document KYC uploadé — userId=$userId, type=$docType, path=$targetPath")
        return document
    }

    @Transactional
    fun reviewDocument(documentId: Long, approved: Boolean, notes: String?, adminId: Long): Document {
        val document = documentRepository.findById(documentId)
            .orElseThrow { NoSuchElementException("Document introuvable: $documentId") }

        document.status = if (approved) DocumentStatus.APPROVED else DocumentStatus.REJECTED
        document.reviewNotes = notes
        document.reviewedAt = Instant.now()
        document.reviewedByAdminId = adminId

        documentRepository.save(document)

        // Met à jour le statut KYC de l'utilisateur
        val user = document.user
        if (approved) {
            val allApproved = documentRepository.findAllByUserId(user.id)
                .filter { it.docType == DocumentType.ID_CARD || it.docType == DocumentType.PASSPORT }
                .all { it.status == DocumentStatus.APPROVED }
            if (allApproved) {
                user.kycStatus = KycStatus.VERIFIED
                userRepository.save(user)
            }
        } else {
            user.kycStatus = KycStatus.REJECTED
            userRepository.save(user)
        }

        return document
    }

    @Transactional(readOnly = true)
    fun getUserDocuments(userId: Long): List<Document> =
        documentRepository.findAllByUserId(userId)

    @Transactional(readOnly = true)
    fun getPendingDocuments(): List<Document> =
        documentRepository.findAllByStatus(DocumentStatus.PENDING_REVIEW)

    private fun validateFile(file: MultipartFile) {
        check(!file.isEmpty) { "Le fichier est vide." }
        check(file.size <= maxSizeBytes) { "Fichier trop volumineux (max: ${maxSizeBytes / 1024 / 1024} Mo)." }
        check(file.contentType in allowed) {
            "Type de fichier non autorisé. Types acceptés: ${allowed.joinToString(", ")}"
        }
    }

    private fun deleteFileQuietly(path: String) = runCatching {
        Files.deleteIfExists(Paths.get(path))
    }.onFailure { log.warn("Impossible de supprimer le fichier: $path", it) }
}
