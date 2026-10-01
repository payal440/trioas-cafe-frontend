export type UserRole = 'super_admin' | 'client_admin' | 'staff' | 'customer';

export interface SuperAdmin {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  isActive?: boolean;
  lastLoginAt?: string | null;
  createdAt?: string;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  logo?: string | null;
  subscriptionPlan: string;
  subscriptionStatus: string;
  maxStaff: number;
  maxOffers: number;
  isActive: boolean;
  createdBy?: string | null;
  createdAt: string;
  updatedAt?: string;
  clientAdmins?: ClientAdmin[];
  _count?: {
    staff?: number;
    customers?: number;
    visitLogs?: number;
    loyaltyPrograms?: number;
    customerRewards?: number;
    whatsappLogs?: number;
  };
}

export interface ClientAdmin {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string | null;
  role?: string;
  isActive: boolean;
  lastLoginAt?: string | null;
  client?: Client;
  createdAt: string;
}

export interface Staff {
  id: string;
  clientId: string;
  name: string;
  email: string;
  phone?: string | null;
  isActive: boolean;
  lastLoginAt?: string | null;
  client?: Client;
  createdAt: string;
}

export interface Customer {
  id: string;
  name: string;
  email?: string | null;
  phone: string;
  qrToken: string;
  qrCodeUrl?: string | null;
  isActive: boolean;
  registeredAt: string;
  clientId?: string | null;
  customerLoyalty?: CustomerLoyalty[];
  customerRewards?: CustomerReward[];
}

export interface LoyaltyProgram {
  id: string;
  clientId: string;
  name: string;
  description?: string | null;
  requiredVisits: number;
  rewardType: string;
  rewardValue?: string | null;
  isActive: boolean;
  validFrom: string;
  validTill?: string | null;
  maxClaimsPerCustomer: number;
  createdAt: string;
  client?: Client;
}

export interface CustomerLoyalty {
  id: string;
  customerId: string;
  clientId: string;
  programId: string;
  totalVisits: number;
  isEligibleForReward: boolean;
  rewardUnlocked: boolean;
  rewardClaimed: boolean;
  lastVisitAt?: string | null;
  eligibleAt?: string | null;
  claimedAt?: string | null;
  program?: LoyaltyProgram;
}

export interface VisitLog {
  id: string;
  customerId: string;
  clientId: string;
  staffId: string;
  visitNumber: number;
  scannedAt: string;
  customer?: Customer;
  staff?: Staff;
  client?: Client;
}

export interface CustomerReward {
  id: string;
  customerId: string;
  clientId: string;
  programId: string;
  rewardCode: string;
  rewardValue?: string | null;
  isRedeemed: boolean;
  redeemedAt?: string | null;
  validUntil?: string | null;
  createdAt: string;
  program?: { id: string; name: string; rewardType?: string };
  customer?: { id: string; name: string; phone: string };
  client?: { id: string; name: string };
}

export interface WhatsAppLog {
  id: string;
  customerId: string;
  clientId: string;
  phoneNumber: string;
  message: string;
  status: string;
  responseId?: string | null;
  errorMessage?: string | null;
  sentAt?: string | null;
  createdAt: string;
  customer?: { id: string; name: string; phone: string };
  client?: { id: string; name: string };
}

export interface SuperAdminDashboardStats {
  clients: { total: number; active: number; inactive: number };
  customers: { total: number };
  visits: { total: number };
  rewards: { total: number; unlocked: number; redeemed: number };
  whatsapp: { sent: number; failed: number };
}

export interface ClientActivity {
  usage: {
    staff: number;
    customers: number;
    loyaltyPrograms: number;
    visitLogs: number;
    customerRewards: number;
    whatsappLogs: number;
  };
  recentVisits: any[];
  recentRewards: any[];
  recentWhatsapp: any[];
}
