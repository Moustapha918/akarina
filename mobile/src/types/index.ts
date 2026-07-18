import { Timestamp } from 'firebase/firestore';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'INVESTOR' | 'ADMIN';

export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ProjectStatus = 'OPEN' | 'FUNDED' | 'CONSTRUCTION' | 'COMPLETED';

export type InvestmentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type DocType = 'ID_CARD' | 'PASSPORT' | 'CONTRACT';

// ─── Firestore Collections ───────────────────────────────────────────────────

/** Collection: users/{userId} */
export interface User {
  id: string;
  name: string;
  email: string;
  phone: string; // format +222XXXXXXXX
  role: UserRole;
  kycStatus: KycStatus;
  kycRejectionReason?: string;
  createdAt: Timestamp;
}

/** Collection: projects/{projectId} */
export interface Project {
  id: string;
  title: string;
  description: string;
  location: string;
  targetAmount: number; // MRU
  collectedAmount: number; // MRU
  roiEstimate: number; // pourcentage, ex: 15.5
  roiDurationMonths: number; // durée estimée du projet en mois
  status: ProjectStatus;
  coverImageUrl: string;
  imageUrls: string[];
  maxInvestors: number; // ex: 200
  currentInvestors: number;
  minInvestment: number; // MRU
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Collection: investments/{investmentId} */
export interface Investment {
  id: string;
  userId: string;
  projectId: string;
  amount: number; // MRU
  bankilyRef?: string;
  status: InvestmentStatus;
  contractUrl?: string;
  contractAcceptedAt?: Timestamp;
  paidAt?: Timestamp;
  createdAt: Timestamp;
}

/** Collection: documents/{documentId} */
export interface Document {
  id: string;
  userId: string;
  docType: DocType;
  filePath: string; // Firebase Storage path
  downloadUrl: string;
  isVerified: boolean;
  rejectionReason?: string;
  uploadedAt: Timestamp;
  verifiedAt?: Timestamp;
}

/** Sous-collection: projects/{projectId}/updates/{updateId} */
export interface ProjectUpdate {
  id: string;
  projectId: string;
  title: string;
  description: string;
  imageUrls: string[];
  videoUrl?: string;
  publishedAt: Timestamp;
}

// ─── DTO / Forms ─────────────────────────────────────────────────────────────

export interface RegisterDTO {
  name: string;
  email: string;
  phone: string;
}

export interface CreateInvestmentDTO {
  projectId: string;
  amount: number;
}
