package mr.akarina.controller

import jakarta.validation.Valid
import mr.akarina.dto.request.InvestmentRequest
import mr.akarina.dto.response.InvestmentResponse
import mr.akarina.dto.response.PaymentInitResponse
import mr.akarina.dto.response.PortfolioResponse
import mr.akarina.security.AkarinaUserPrincipal
import mr.akarina.service.InvestmentService
import org.springframework.http.HttpStatus
import org.springframework.security.core.annotation.AuthenticationPrincipal
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/investments")
class InvestmentController(private val investmentService: InvestmentService) {

    /**
     * Initie un investissement et déclenche le paiement Bankily Push.
     * Retourne le token de session pour que le front puisse afficher le statut.
     */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    fun invest(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
        @Valid @RequestBody request: InvestmentRequest,
    ): PaymentInitResponse = investmentService.initiateInvestment(principal.userId, request)

    /** Résumé du portefeuille de l'investisseur connecté */
    @GetMapping("/portfolio")
    fun getPortfolio(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
    ): PortfolioResponse = investmentService.getPortfolio(principal.userId)

    /** Historique complet de tous les investissements (y compris PENDING/FAILED) */
    @GetMapping("/history")
    fun getHistory(
        @AuthenticationPrincipal principal: AkarinaUserPrincipal,
    ): List<InvestmentResponse> = investmentService.getUserInvestments(principal.userId)
}
