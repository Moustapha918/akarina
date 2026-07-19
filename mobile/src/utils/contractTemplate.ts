import { User, Project } from '../types';
import { generateConstructionContractHTML } from './contractConstruction';
import { generateLandFlipContractHTML } from './contractLandFlip';

/**
 * Point d'entrée unique : sélectionne le bon template selon le type de projet.
 */
export function generateContractHTML(
  user: User,
  project: Project,
  amount: number,
  investmentId: string
): string {
  if (project.projectType === 'LAND_FLIP') {
    return generateLandFlipContractHTML(user, project, amount, investmentId);
  }
  return generateConstructionContractHTML(user, project, amount, investmentId);
}
