export type ProjectStatus = 'OPEN' | 'FUNDED' | 'CONSTRUCTION' | 'COMPLETED' | 'CANCELLED';

export interface Project {
  id: number;
  title: string;
  description: string;
  location: string;
  targetAmount: number;
  collectedAmount: number;
  remainingAmount: number;
  fundingPercentage: number;
  roiEstimate: number;
  status: ProjectStatus;
  maxInvestors: number;
  minInvestmentAmount: number;
  coverImageUrl: string | null;
  photoUrls: string[];
  investorCount: number;
  createdAt: string;
}

export interface ProjectPage {
  content: Project[];
  totalElements: number;
  totalPages: number;
  number: number;
  size: number;
}
