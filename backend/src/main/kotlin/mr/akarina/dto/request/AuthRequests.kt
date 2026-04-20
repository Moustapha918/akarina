package mr.akarina.dto.request

import jakarta.validation.constraints.Email
import jakarta.validation.constraints.NotBlank
import jakarta.validation.constraints.Pattern
import jakarta.validation.constraints.Size

data class LoginRequest(
    @field:NotBlank @field:Email
    val email: String,

    @field:NotBlank @field:Size(min = 8)
    val password: String,
)

data class RegisterRequest(
    @field:NotBlank @field:Size(min = 3, max = 100)
    val fullName: String,

    @field:NotBlank @field:Email
    val email: String,

    @field:NotBlank
    @field:Pattern(
        regexp = "^\\+222[234679]\\d{7}$",
        message = "Format invalide. Attendu: +222XXXXXXXX"
    )
    val phone: String,

    @field:NotBlank @field:Size(min = 8, max = 72)
    val password: String,
)
