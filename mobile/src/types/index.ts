import { Timestamp } from 'firebase/firestore';

// ─── Enums ───────────────────────────────────────────────────────────────────

export type UserRole = 'INVESTOR' | 'ADMIN';

export type KycStatus = 'NONE' | 'PENDING' | 'VERIFIED' | 'REJECTED';

export type ProjectType = 'CONSTRUCTION' | 'LAND_FLIP';

export type ExitStrategy = 'SALE' | 'RENTAL';

export type ProjectStatus = 'OPEN' | 'FUNDED' | 'CONSTRUCTION' | 'RENTING' | 'COMPLETED';

export type InvestmentStatus = 'PENDING' | 'SUCCESS' | 'FAILED';

export type PayoutType = 'RENTAL' | 'PROFIT';

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
  roiEstimate: number; // pourcentage annuel, ex: 15.5
  roiDurationMonths: number; // durée estimée du projet en mois
  status: ProjectStatus;
  projectType: ProjectType; // 'CONSTRUCTION' | 'LAND_FLIP'
  exitStrategy?: ExitStrategy; // 'SALE' | 'RENTAL' — CONSTRUCTION seulement
  monthlyRent?: number; // loyer mensuel total du bien (MRU) — si RENTAL
  expectedSalePrice?: number; // prix de revente estimé (MRU)
  coverImageUrl: string;
  imageUrls: string[];
  maxInvestors: number;
  currentInvestors: number;
  minInvestment: number; // MRU
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/** Collection: payouts/{payoutId} */
export interface Payout {
  id: string;
  projectId: string;
  userId: string;
  investmentId: string;
  amount: number; // MRU versé à cet investisseur
  type: PayoutType;
  month: string; // 'YYYY-MM' pour RENTAL
  paidAt: Timestamp;
  createdAt: Timestamp;
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
