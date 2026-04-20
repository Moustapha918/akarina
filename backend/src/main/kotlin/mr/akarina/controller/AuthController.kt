package mr.akarina.controller

import jakarta.validation.Valid
import mr.akarina.dto.request.LoginRequest
import mr.akarina.dto.request.RegisterRequest
import mr.akarina.dto.response.AuthResponse
import mr.akarina.service.AuthService
import org.springframework.http.HttpStatus
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/auth")
class AuthController(private val authService: AuthService) {

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    fun register(@Valid @RequestBody request: RegisterRequest): AuthResponse =
        authService.register(request)

    @PostMapping("/login")
    fun login(@Valid @RequestBody request: LoginRequest): AuthResponse =
        authService.login(request)
}
