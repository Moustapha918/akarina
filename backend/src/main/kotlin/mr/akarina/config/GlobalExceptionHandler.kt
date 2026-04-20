package mr.akarina.config

import org.slf4j.LoggerFactory
import org.springframework.http.HttpStatus
import org.springframework.http.ProblemDetail
import org.springframework.security.access.AccessDeniedException
import org.springframework.web.bind.MethodArgumentNotValidException
import org.springframework.web.bind.annotation.ExceptionHandler
import org.springframework.web.bind.annotation.RestControllerAdvice

@RestControllerAdvice
class GlobalExceptionHandler {
    private val log = LoggerFactory.getLogger(GlobalExceptionHandler::class.java)

    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidation(ex: MethodArgumentNotValidException): ProblemDetail {
        val errors = ex.bindingResult.fieldErrors
            .associate { it.field to (it.defaultMessage ?: "Valeur invalide") }
        return ProblemDetail.forStatus(HttpStatus.BAD_REQUEST).also {
            it.title = "Données invalides"
            it.setProperty("errors", errors)
        }
    }

    @ExceptionHandler(IllegalArgumentException::class, IllegalStateException::class)
    fun handleBusinessError(ex: RuntimeException): ProblemDetail =
        ProblemDetail.forStatus(HttpStatus.BAD_REQUEST).also {
            it.title = "Erreur métier"
            it.detail = ex.message
        }

    @ExceptionHandler(NoSuchElementException::class)
    fun handleNotFound(ex: NoSuchElementException): ProblemDetail =
        ProblemDetail.forStatus(HttpStatus.NOT_FOUND).also {
            it.title = "Ressource introuvable"
            it.detail = ex.message
        }

    @ExceptionHandler(AccessDeniedException::class)
    fun handleAccessDenied(ex: AccessDeniedException): ProblemDetail =
        ProblemDetail.forStatus(HttpStatus.FORBIDDEN).also {
            it.title = "Accès refusé"
            it.detail = "Vous n'avez pas les droits pour effectuer cette action."
        }

    @ExceptionHandler(Exception::class)
    fun handleGeneral(ex: Exception): ProblemDetail {
        log.error("Erreur inattendue", ex)
        return ProblemDetail.forStatus(HttpStatus.INTERNAL_SERVER_ERROR).also {
            it.title = "Erreur interne"
            it.detail = "Une erreur inattendue s'est produite. Veuillez réessayer."
        }
    }
}
