package mr.akarina.controller

import mr.akarina.domain.entity.Document
import mr.akarina.domain.entity.DocumentType
import mr.akarina.security.AkarinaUserPrincipal
import mr.akarina.service.KycService
import org.springframework.http.HttpStatus
import org.springframework.http.MediaType
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*
import org.springframework.web.multipart.MultipartFile

@RestController
@RequestMapping("/kyc")
class KycController(private val kycService: KycService) {

    /** Upload d'un document d'identité par l'investisseur */
    @PostMapping("/upload", consumes = [MediaType.MULTIPART_FORM_DATA_VALUE])
    @ResponseStatus(HttpStatus.CREATED)
    fun uploadDocument(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
        @RequestParam docType: DocumentType,
        @RequestParam file: MultipartFile,
    ): Map<String, Any> {
        val doc = kycService.uploadDocument(principal.userId, docType, file)
        return mapOf(
            "documentId" to doc.id,
            "docType" to doc.docType,
            "status" to doc.status,
            "message" to "Document uploadé avec succès. En attente de validation par l'équipe Akarina.",
        )
    }

    /** Liste des documents de l'investisseur connecté */
    @GetMapping("/my-documents")
    fun getMyDocuments(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
    ): List<Document> = kycService.getUserDocuments(principal.userId)

    // ── Admin ─────────────────────────────────────────────────────────────

    /** Tous les documents en attente de validation */
    @GetMapping("/pending")
    @PreAuthorize("hasRole('ADMIN')")
    fun getPendingDocuments(): List<Document> = kycService.getPendingDocuments()

    /** Valide ou rejette un document */
    @PatchMapping("/{documentId}/review")
    @PreAuthorize("hasRole('ADMIN')")
    fun reviewDocument(
        @PathVariable documentId: Long,
        @RequestParam approved: Boolean,
        @RequestParam(required = false) notes: String?,
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
    ): Document = kycService.reviewDocument(documentId, approved, notes, principal.userId)
}
