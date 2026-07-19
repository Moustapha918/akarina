import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus, ProjectType } from '../types';
import { getProjects } from '../services/projectService';

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

const STATUS_ORDER: Record<ProjectStatus, number> = {
  OPEN: 0,
  FUNDED: 1,
  CONSTRUCTION: 2,
  RENTING: 3,
  COMPLETED: 4,
};

export function useProjects(projectType?: ProjectType) {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const all = await getProjects();
      const filtered = projectType
        ? all.filter((p) => (p.projectType ?? 'CONSTRUCTION') === projectType)
        : all;
      const sorted = [...filtered].sort(
        (a, b) => (STATUS_ORDER[a.status] ?? 99) - (STATUS_ORDER[b.status] ?? 99)
      );
      setState({ projects: sorted, isLoading: false, error: null });
    } catch (e: any) {
      setState({ projects: [], isLoading: false, error: e.message ?? 'Erreur de chargement.' });
    }
  }, [projectType]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
