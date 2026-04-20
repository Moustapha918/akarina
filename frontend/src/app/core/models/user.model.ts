export type UserRole = 'INVESTOR' | 'ADMIN';
export type KycStatus = 'PENDING' | 'SUBMITTED' | 'VERIFIED' | 'REJECTED';

export interface User {
  userId: number;
  fullName: string;
  email: string;
  role: UserRole;
  kycStatus: KycStatus;
}

export interface AuthResponse extends User {
  token: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  fullName: string;
  email: string;
  phone: string;
  password: string;
}
