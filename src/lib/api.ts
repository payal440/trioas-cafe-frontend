import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import {
  Customer,
  Client,
  Staff,
  ClientAdmin,
  SuperAdmin,
  LoyaltyProgram,
  VisitLog,
  CustomerReward,
  WhatsAppLog,
  SuperAdminDashboardStats,
  ClientActivity,
} from '@/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// Helper for getting active token based on role or fallback
export const getStoredToken = (role?: string | null): string | null => {
  if (typeof window === 'undefined') return null;
  if (role) {
    return localStorage.getItem(`trioas_token_${role}`);
  }
  return (
    localStorage.getItem('trioas_token_super_admin') ||
    localStorage.getItem('trioas_token_client_admin') ||
    localStorage.getItem('trioas_token_staff') ||
    localStorage.getItem('trioas_token')
  );
};

export const setStoredToken = (role: string, token: string | null) => {
  if (typeof window === 'undefined') return;
  if (!token) {
    localStorage.removeItem(`trioas_token_${role}`);
    localStorage.removeItem('trioas_token');
  } else {
    localStorage.setItem(`trioas_token_${role}`, token);
    localStorage.setItem('trioas_token', token);
  }
};

// Request interceptor to attach Bearer token
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const customRole = (config as any).role;
  const token = getStoredToken(customRole);
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for clear errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const errorData = error.response?.data;
    let message = 'Something went wrong with the server.';

    if (errorData?.errors && Array.isArray(errorData.errors) && errorData.errors.length > 0) {
      const issues = errorData.errors.map((e: any) => `${e.path ? `${e.path}: ` : ''}${e.message}`).join(', ');
      message = `Validation failed: ${issues}`;
    } else if (errorData?.message) {
      message = errorData.message;
    } else if (errorData?.error) {
      message = errorData.error;
    } else if (error.message) {
      message = error.message;
    }

    return Promise.reject(new Error(message));
  }
);

// Helper to extract data from backend envelope { success: true, data: ... }
const extractData = (res: any) => {
  if (res && res.data && typeof res.data === 'object' && 'data' in res.data) {
    return res.data.data;
  }
  return res.data;
};

// ================= SUPER ADMIN API =================
export const superAdminApi = {
  login: async (payload: { email: string; password: string }): Promise<{ token: string; user: SuperAdmin }> => {
    const res = await apiClient.post('/api/super-admin/auth/login', payload);
    const data = extractData(res);
    return {
      token: data.token,
      user: data.user,
    };
  },
  me: async (): Promise<{ superAdmin: SuperAdmin }> => {
    const res = await apiClient.get('/api/super-admin/auth/me', { role: 'super_admin' } as any);
    const data = extractData(res);
    return { superAdmin: data };
  },
  dashboard: async (): Promise<SuperAdminDashboardStats> => {
    const res = await apiClient.get('/api/super-admin/dashboard', { role: 'super_admin' } as any);
    return extractData(res);
  },
  listClients: async (query?: { search?: string; isActive?: boolean | string; page?: number; limit?: number }): Promise<{ clients: Client[]; pagination: any }> => {
    const res = await apiClient.get('/api/super-admin/clients', {
      params: query,
      role: 'super_admin',
    } as any);
    const data = extractData(res);
    return {
      clients: data.items || data || [],
      pagination: data.pagination,
    };
  },
  createClient: async (payload: {
    name: string;
    email: string;
    phone?: string;
    address?: string;
    subscriptionPlan?: string;
    maxStaff?: number;
    maxOffers?: number;
  }): Promise<{ client: Client }> => {
    const res = await apiClient.post('/api/super-admin/clients', payload, { role: 'super_admin' } as any);
    return { client: extractData(res) };
  },
  getClient: async (id: string): Promise<{ client: Client }> => {
    const res = await apiClient.get(`/api/super-admin/clients/${id}`, { role: 'super_admin' } as any);
    return { client: extractData(res) };
  },
  updateClient: async (id: string, payload: Partial<Client>): Promise<{ client: Client }> => {
    const res = await apiClient.patch(`/api/super-admin/clients/${id}`, payload, { role: 'super_admin' } as any);
    return { client: extractData(res) };
  },
  setClientStatus: async (id: string, isActive: boolean): Promise<{ client: Client }> => {
    const res = await apiClient.patch(`/api/super-admin/clients/${id}/status`, { isActive }, { role: 'super_admin' } as any);
    return { client: extractData(res) };
  },
  deleteClient: async (id: string): Promise<{ client: Client }> => {
    const res = await apiClient.delete(`/api/super-admin/clients/${id}`, { role: 'super_admin' } as any);
    return { client: extractData(res) };
  },
  getClientActivity: async (id: string): Promise<ClientActivity> => {
    const res = await apiClient.get(`/api/super-admin/clients/${id}/activity`, { role: 'super_admin' } as any);
    return extractData(res);
  },
  listClientAdmins: async (clientId: string): Promise<{ admins: ClientAdmin[] }> => {
    const res = await apiClient.get(`/api/super-admin/clients/${clientId}/admins`, { role: 'super_admin' } as any);
    const data = extractData(res);
    return { admins: Array.isArray(data) ? data : data.items || [] };
  },
  createClientAdmin: async (
    clientId: string,
    payload: { name: string; email: string; password: string; phone?: string }
  ): Promise<{ admin: ClientAdmin }> => {
    const res = await apiClient.post(`/api/super-admin/clients/${clientId}/admins`, payload, { role: 'super_admin' } as any);
    return { admin: extractData(res) };
  },
  updateClientAdmin: async (
    clientId: string,
    adminId: string,
    payload: { name?: string; email?: string; password?: string; phone?: string }
  ): Promise<{ admin: ClientAdmin }> => {
    const res = await apiClient.patch(`/api/super-admin/clients/${clientId}/admins/${adminId}`, payload, { role: 'super_admin' } as any);
    return { admin: extractData(res) };
  },
  setClientAdminStatus: async (clientId: string, adminId: string, isActive: boolean): Promise<{ admin: ClientAdmin }> => {
    const res = await apiClient.patch(
      `/api/super-admin/clients/${clientId}/admins/${adminId}/status`,
      { isActive },
      { role: 'super_admin' } as any
    );
    return { admin: extractData(res) };
  },
  listRewards: async (query?: { isRedeemed?: boolean | string; clientId?: string; page?: number; limit?: number }): Promise<{ rewards: CustomerReward[]; pagination: any }> => {
    const res = await apiClient.get('/api/super-admin/rewards', {
      params: query,
      role: 'super_admin',
    } as any);
    const data = extractData(res);
    return {
      rewards: data.items || data || [],
      pagination: data.pagination,
    };
  },
  listWhatsAppLogs: async (query?: { status?: string; clientId?: string; page?: number; limit?: number }): Promise<{ logs: WhatsAppLog[]; pagination: any }> => {
    const res = await apiClient.get('/api/super-admin/whatsapp-logs', {
      params: query,
      role: 'super_admin',
    } as any);
    const data = extractData(res);
    return {
      logs: data.items || data || [],
      pagination: data.pagination,
    };
  },
};

// ================= CLIENT ADMIN (CAFE OWNER) API =================
export const clientAdminApi = {
  login: async (payload: { email: string; password: string }): Promise<{ token: string; clientAdmin: ClientAdmin }> => {
    const res = await apiClient.post('/api/client-admin/auth/login', payload);
    const data = extractData(res);
    return {
      token: data.token,
      clientAdmin: data.user,
    };
  },
  me: async (): Promise<{ clientAdmin: ClientAdmin }> => {
    const res = await apiClient.get('/api/client-admin/auth/me', { role: 'client_admin' } as any);
    return { clientAdmin: extractData(res) };
  },
  dashboard: async (): Promise<{
    stats: {
      totalCustomers: number;
      totalStaff: number;
      totalVisits: number;
      visitsToday: number;
      rewardsIssued: number;
      rewardsRedeemed: number;
    };
    recentVisits: VisitLog[];
    activePrograms: LoyaltyProgram[];
  }> => {
    const res = await apiClient.get('/api/client-admin/dashboard', { role: 'client_admin' } as any);
    return extractData(res);
  },
  listStaff: async (): Promise<{ staff: Staff[] }> => {
    const res = await apiClient.get('/api/client-admin/staff', { role: 'client_admin' } as any);
    const data = extractData(res);
    return { staff: data.items || (Array.isArray(data) ? data : []) };
  },
  createStaff: async (payload: { name: string; email: string; password: string; phone?: string }): Promise<{ staff: Staff }> => {
    const res = await apiClient.post('/api/client-admin/staff', payload, { role: 'client_admin' } as any);
    return { staff: extractData(res) };
  },
  updateStaff: async (id: string, payload: Partial<Staff>): Promise<{ staff: Staff }> => {
    const res = await apiClient.patch(`/api/client-admin/staff/${id}`, payload, { role: 'client_admin' } as any);
    return { staff: extractData(res) };
  },
  setStaffStatus: async (id: string, isActive: boolean): Promise<{ staff: Staff }> => {
    const res = await apiClient.patch(`/api/client-admin/staff/${id}/status`, { isActive }, { role: 'client_admin' } as any);
    return { staff: extractData(res) };
  },
  listLoyaltyPrograms: async (): Promise<{ programs: LoyaltyProgram[] }> => {
    const res = await apiClient.get('/api/client-admin/loyalty-programs', { role: 'client_admin' } as any);
    const data = extractData(res);
    return { programs: Array.isArray(data) ? data : data.items || [] };
  },
  createLoyaltyProgram: async (payload: {
    name: string;
    description?: string;
    requiredVisits: number;
    rewardType?: string;
    rewardValue?: string;
  }): Promise<{ program: LoyaltyProgram }> => {
    const res = await apiClient.post('/api/client-admin/loyalty-programs', payload, { role: 'client_admin' } as any);
    return { program: extractData(res) };
  },
  updateLoyaltyProgram: async (id: string, payload: Partial<LoyaltyProgram>): Promise<{ program: LoyaltyProgram }> => {
    const res = await apiClient.patch(`/api/client-admin/loyalty-programs/${id}`, payload, { role: 'client_admin' } as any);
    return { program: extractData(res) };
  },
  setLoyaltyProgramStatus: async (id: string, isActive: boolean): Promise<{ program: LoyaltyProgram }> => {
    const res = await apiClient.patch(`/api/client-admin/loyalty-programs/${id}/status`, { isActive }, { role: 'client_admin' } as any);
    return { program: extractData(res) };
  },
  listCustomers: async (): Promise<{ customers: Customer[] }> => {
    const res = await apiClient.get('/api/client-admin/customers', { role: 'client_admin' } as any);
    const data = extractData(res);
    return { customers: data.items || (Array.isArray(data) ? data : []) };
  },
  createCustomer: async (payload: { name: string; phone: string; email?: string }): Promise<{ customer: Customer }> => {
    const res = await apiClient.post('/api/client-admin/customers', payload, { role: 'client_admin' } as any);
    return { customer: extractData(res) };
  },
  listVisits: async (): Promise<{ visits: VisitLog[] }> => {
    const res = await apiClient.get('/api/client-admin/visits', { role: 'client_admin' } as any);
    const data = extractData(res);
    return { visits: data.items || (Array.isArray(data) ? data : []) };
  },
  listRewards: async (): Promise<{ rewards: CustomerReward[] }> => {
    const res = await apiClient.get('/api/client-admin/rewards', { role: 'client_admin' } as any);
    const data = extractData(res);
    return { rewards: data.items || (Array.isArray(data) ? data : []) };
  },
};

// ================= STAFF API =================
export const staffApi = {
  login: async (payload: { email: string; password: string }): Promise<{ token: string; staff: Staff }> => {
    const res = await apiClient.post('/api/staff/auth/login', payload);
    const data = extractData(res);
    return {
      token: data.token,
      staff: data.user,
    };
  },
  me: async (): Promise<{ staff: Staff }> => {
    const res = await apiClient.get('/api/staff/auth/me', { role: 'staff' } as any);
    return { staff: extractData(res) };
  },
  validateQR: async (qrToken: string): Promise<{
    valid: boolean;
    customer: Customer;
    loyalty?: any;
    rewardEligible?: boolean;
    activeProgram?: LoyaltyProgram;
  }> => {
    const res = await apiClient.post('/api/staff/scan/validate', { qrToken }, { role: 'staff' } as any);
    return extractData(res);
  },
  recordVisit: async (payload: { customerId: string; clientId?: string }): Promise<{
    success: boolean;
    message: string;
    visitLog: VisitLog;
    loyalty: any;
    rewardUnlocked: boolean;
    rewardCode?: string;
  }> => {
    const res = await apiClient.post('/api/staff/scan/record-visit', payload, { role: 'staff' } as any);
    return extractData(res);
  },
  redeemReward: async (payload: { rewardCode: string; customerId: string }): Promise<{
    success: boolean;
    message: string;
    reward: CustomerReward;
  }> => {
    const res = await apiClient.post('/api/staff/rewards/redeem', payload, { role: 'staff' } as any);
    return extractData(res);
  },
  getVisits: async (): Promise<{ visits: VisitLog[] }> => {
    const res = await apiClient.get('/api/staff/visits', { role: 'staff' } as any);
    const data = extractData(res);
    return { visits: data.items || (Array.isArray(data) ? data : []) };
  },
};

// ================= CUSTOMER API =================
export const customerApi = {
  register: async (payload: { name: string; phone: string; email?: string; clientId?: string }): Promise<{ message: string; customer: Customer }> => {
    const res = await apiClient.post('/api/customer/register', payload);
    const data = extractData(res);
    return {
      message: res.data?.message || 'Registered',
      customer: data.customer || data,
    };
  },
  lookup: async (phone: string): Promise<{ customer: Customer; loyalty?: any; rewards?: CustomerReward[] }> => {
    const res = await apiClient.post('/api/customer/lookup', { phone });
    const data = extractData(res);
    return {
      customer: data.customer || data,
      loyalty: data.loyalty,
      rewards: data.rewards,
    };
  },
  getByToken: async (token: string): Promise<{ customer: Customer; loyalty?: any; cafe?: Client }> => {
    const res = await apiClient.get(`/api/customer/qr/${token}`);
    const data = extractData(res);
    return {
      customer: data.customer || data,
      loyalty: data.loyalty,
      cafe: data.cafe,
    };
  },
  getRewards: async (customerId: string): Promise<{ rewards: CustomerReward[] }> => {
    const res = await apiClient.get(`/api/customer/${customerId}/rewards`);
    const data = extractData(res);
    return { rewards: Array.isArray(data) ? data : data.items || [] };
  },
};
