export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'EXPIRED';

export interface Investment {
  id: number;
  projectId: number;
  projectTitle: string;
  amount: number;
  ownershipShare: number;
  paymentStatus: PaymentStatus;
  bankilyRef: string | null;
  contractUrl: string | null;
  createdAt: string;
}

export interface Portfolio {
  totalInvested: number;
  activeInvestments: number;
  investments: Investment[];
}

export interface InvestmentRequest {
  projectId: number;
  amount: number;
  contractAccepted: boolean;
}

export interface PaymentInitResponse {
  investmentId: number;
  bankilySessionToken: string;
  lockExpiresAt: string;
  message: string;
}
