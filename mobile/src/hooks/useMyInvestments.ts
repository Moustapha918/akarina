import { useState, useEffect, useCallback } from 'react';
import { getInvestmentsByUser } from '../services/investmentService';
import { getProject } from '../services/projectService';
import { Investment, Project } from '../types';

export interface InvestmentWithProject {
  investment: Investment;
  project: Project | null;
}

interface State {
  items: InvestmentWithProject[];
  isLoading: boolean;
  error: string | null;
}

export function useMyInvestments(userId: string | null) {
  const [state, setState] = useState<State>({ items: [], isLoading: true, error: null });

  const fetch = useCallback(async () => {
    if (!userId) {
      setState({ items: [], isLoading: false, error: null });
      return;
    }
    setState((s) => ({ ...s, isLoading: true, error: null }));
    try {
      const investments = await getInvestmentsByUser(userId);
      // Récupère les projets en parallèle (dédupliqués par projectId)
      const projectIds = [...new Set(investments.map((i) => i.projectId))];
      const projectMap = new Map<string, Project | null>();
      await Promise.all(
        projectIds.map(async (id) => {
          projectMap.set(id, await getProject(id));
        })
      );
      const items: InvestmentWithProject[] = investments.map((investment) => ({
        investment,
        project: projectMap.get(investment.projectId) ?? null,
      }));
      setState({ items, isLoading: false, error: null });
    } catch (e: any) {
      setState({ items: [], isLoading: false, error: e?.message ?? 'Erreur de chargement' });
    }
  }, [userId]);

  useEffect(() => { fetch(); }, [fetch]);

  return { ...state, refresh: fetch };
}
