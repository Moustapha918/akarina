import { useState, useEffect, useCallback } from 'react';
import { Project, ProjectStatus } from '../types';
import { getProjects } from '../services/projectService';

interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

export function useProjects(status?: ProjectStatus) {
  const [state, setState] = useState<ProjectsState>({
    projects: [],
    isLoading: true,
    error: null,
  });

  const fetch = useCallback(async () => {
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const projects = await getProjects(status);
      setState({ projects, isLoading: false, error: null });
    } catch (e: any) {
      setState({ projects: [], isLoading: false, error: e.message ?? 'Erreur de chargement.' });
    }
  }, [status]);

  useEffect(() => {
    fetch();
  }, [fetch]);

  return { ...state, refetch: fetch };
}
