package mr.akarina.service

import mr.akarina.domain.entity.Project
import mr.akarina.domain.entity.ProjectStatus
import mr.akarina.dto.request.ProjectRequest
import mr.akarina.dto.response.ProjectResponse
import mr.akarina.repository.InvestmentRepository
import mr.akarina.repository.ProjectRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class ProjectService(
    private val projectRepository: ProjectRepository,
    private val investmentRepository: InvestmentRepository,
) {
    @Transactional(readOnly = true)
    fun listProjects(status: ProjectStatus?, pageable: Pageable): Page<ProjectResponse> {
        val page = if (status != null)
            projectRepository.findAllByStatus(status, pageable)
        else
            projectRepository.findAllByStatusIn(
                listOf(ProjectStatus.OPEN, ProjectStatus.FUNDED, ProjectStatus.CONSTRUCTION),
                pageable
            )
        return page.map { toResponse(it) }
    }

    @Transactional(readOnly = true)
    fun getProject(id: Long): ProjectResponse {
        val project = projectRepository.findById(id)
            .orElseThrow { NoSuchElementException("Projet introuvable: $id") }
        return toResponse(project)
    }

    @Transactional(readOnly = true)
    fun searchProjects(query: String, pageable: Pageable): Page<ProjectResponse> =
        projectRepository.search(query, pageable).map { toResponse(it) }

    // ── Admin operations ───────────────────────────────────────────────────

    @Transactional
    fun createProject(request: ProjectRequest): ProjectResponse {
        val project = projectRepository.save(
            Project(
                title = request.title,
                description = request.description,
                location = request.location,
                targetAmount = request.targetAmount,
                roiEstimate = request.roiEstimate,
                maxInvestors = request.maxInvestors,
                minInvestmentAmount = request.minInvestmentAmount,
                status = request.status,
                coverImageUrl = request.coverImageUrl,
            )
        )
        return toResponse(project)
    }

    @Transactional
    fun updateProject(id: Long, request: ProjectRequest): ProjectResponse {
        val project = projectRepository.findById(id)
            .orElseThrow { NoSuchElementException("Projet introuvable: $id") }

        project.apply {
            title = request.title
            description = request.description
            location = request.location
            targetAmount = request.targetAmount
            roiEstimate = request.roiEstimate
            maxInvestors = request.maxInvestors
            minInvestmentAmount = request.minInvestmentAmount
            status = request.status
            coverImageUrl = request.coverImageUrl
        }
        return toResponse(projectRepository.save(project))
    }

    @Transactional
    fun updateStatus(id: Long, status: ProjectStatus): ProjectResponse {
        val project = projectRepository.findById(id)
            .orElseThrow { NoSuchElementException("Projet introuvable: $id") }
        project.status = status
        return toResponse(projectRepository.save(project))
    }

    private fun toResponse(project: Project): ProjectResponse {
        val count = investmentRepository.countSuccessfulInvestorsByProjectId(project.id)
        return ProjectResponse.from(project, count)
    }
}
