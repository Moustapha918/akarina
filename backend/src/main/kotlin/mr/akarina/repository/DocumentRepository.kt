package mr.akarina.repository

import mr.akarina.domain.entity.Document
import mr.akarina.domain.entity.DocumentStatus
import mr.akarina.domain.entity.DocumentType
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.stereotype.Repository

@Repository
interface DocumentRepository : JpaRepository<Document, Long> {
    fun findAllByUserId(userId: Long): List<Document>
    fun findAllByStatus(status: DocumentStatus): List<Document>
    fun findByUserIdAndDocType(userId: Long, docType: DocumentType): Document?
}
