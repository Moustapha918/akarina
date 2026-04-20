package mr.akarina.repository

import mr.akarina.domain.entity.Project
import mr.akarina.domain.entity.ProjectStatus
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.stereotype.Repository

@Repository
interface ProjectRepository : JpaRepository<Project, Long> {
    fun findAllByStatus(status: ProjectStatus, pageable: Pageable): Page<Project>
    fun findAllByStatusIn(statuses: List<ProjectStatus>, pageable: Pageable): Page<Project>

    @Query("SELECT p FROM Project p WHERE LOWER(p.title) LIKE LOWER(CONCAT('%', :query, '%')) OR LOWER(p.location) LIKE LOWER(CONCAT('%', :query, '%'))")
    fun search(query: String, pageable: Pageable): Page<Project>
}
