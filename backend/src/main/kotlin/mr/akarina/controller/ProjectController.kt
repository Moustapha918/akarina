package mr.akarina.controller

import jakarta.validation.Valid
import mr.akarina.domain.entity.ProjectStatus
import mr.akarina.dto.request.ProjectRequest
import mr.akarina.dto.response.ProjectResponse
import mr.akarina.service.ProjectService
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.web.PageableDefault
import org.springframework.http.HttpStatus
import org.springframework.security.access.prepost.PreAuthorize
import org.springframework.web.bind.annotation.*

@RestController
@RequestMapping("/projects")
class ProjectController(private val projectService: ProjectService) {

    /** Public — liste paginée des projets actifs */
    @GetMapping
    fun listProjects(
        @RequestParam(required = false) status: ProjectStatus?,
        @PageableDefault(size = 12, sort = ["createdAt"]) pageable: Pageable,
    ): Page<ProjectResponse> = projectService.listProjects(status, pageable)

    /** Public — recherche textuelle */
    @GetMapping("/search")
    fun search(
        @RequestParam q: String,
        @PageableDefault(size = 12) pageable: Pageable,
    ): Page<ProjectResponse> = projectService.searchProjects(q, pageable)

    /** Public — détail d'un projet */
    @GetMapping("/{id}")
    fun getProject(@PathVariable id: Long): ProjectResponse =
        projectService.getProject(id)

    // ── Admin ─────────────────────────────────────────────────────────────

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('ADMIN')")
    fun createProject(@Valid @RequestBody request: ProjectRequest): ProjectResponse =
        projectService.createProject(request)

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateProject(
        @PathVariable id: Long,
        @Valid @RequestBody request: ProjectRequest,
    ): ProjectResponse = projectService.updateProject(id, request)

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasRole('ADMIN')")
    fun updateStatus(
        @PathVariable id: Long,
        @RequestParam status: ProjectStatus,
    ): ProjectResponse = projectService.updateStatus(id, status)
}
