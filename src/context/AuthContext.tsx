'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserRole, SuperAdmin, ClientAdmin, Staff, Customer } from '@/types';
import { staffApi, clientAdminApi, superAdminApi, setStoredToken, getStoredToken } from '@/lib/api';

interface AuthContextType {
  role: UserRole | null;
  user: SuperAdmin | ClientAdmin | Staff | Customer | null;
  token: string | null;
  loading: boolean;
  loginSuperAdmin: (email: string, pass: string) => Promise<void>;
  loginClientAdmin: (email: string, pass: string) => Promise<void>;
  loginStaff: (email: string, pass: string) => Promise<void>;
  setCustomerSession: (customer: Customer) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [role, setRole] = useState<UserRole | null>(null);
  const [user, setUser] = useState<any>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Initialize session on mount
  useEffect(() => {
    const initSession = async () => {
      try {
        const savedRole = localStorage.getItem('trioas_active_role') as UserRole | null;
        if (!savedRole) {
          setLoading(false);
          return;
        }

        if (savedRole === 'customer') {
          const savedCustomer = localStorage.getItem('trioas_customer_session');
          if (savedCustomer) {
            setRole('customer');
            setUser(JSON.parse(savedCustomer));
          }
          setLoading(false);
          return;
        }

        const savedToken = getStoredToken(savedRole);
        if (!savedToken) {
          setLoading(false);
          return;
        }

        const cachedUserStr = localStorage.getItem(`trioas_user_${savedRole}`);
        if (cachedUserStr) {
          try {
            setUser(JSON.parse(cachedUserStr));
          } catch {}
        }

        setToken(savedToken);
        setRole(savedRole);

        // Fetch fresh profile
        if (savedRole === 'super_admin') {
          const res = await superAdminApi.me();
          if (res?.superAdmin) {
            setUser(res.superAdmin);
            localStorage.setItem('trioas_user_super_admin', JSON.stringify(res.superAdmin));
          }
        } else if (savedRole === 'client_admin') {
          const res = await clientAdminApi.me();
          if (res?.clientAdmin) {
            setUser(res.clientAdmin);
            localStorage.setItem('trioas_user_client_admin', JSON.stringify(res.clientAdmin));
          }
        } else if (savedRole === 'staff') {
          const res = await staffApi.me();
          if (res?.staff) {
            setUser(res.staff);
            localStorage.setItem('trioas_user_staff', JSON.stringify(res.staff));
          }
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);
      } finally {
        setLoading(false);
      }
    };

    initSession();
  }, []);

  const loginSuperAdmin = async (email: string, pass: string) => {
    const res = await superAdminApi.login({ email, password: pass });
    setStoredToken('super_admin', res.token);
    localStorage.setItem('trioas_active_role', 'super_admin');
    localStorage.setItem('trioas_user_super_admin', JSON.stringify(res.user));
    setRole('super_admin');
    setUser(res.user);
    setToken(res.token);
  };

  const loginClientAdmin = async (email: string, pass: string) => {
    const res = await clientAdminApi.login({ email, password: pass });
    setStoredToken('client_admin', res.token);
    localStorage.setItem('trioas_active_role', 'client_admin');
    localStorage.setItem('trioas_user_client_admin', JSON.stringify(res.clientAdmin));
    setRole('client_admin');
    setUser(res.clientAdmin);
    setToken(res.token);
  };

  const loginStaff = async (email: string, pass: string) => {
    const res = await staffApi.login({ email, password: pass });
    setStoredToken('staff', res.token);
    localStorage.setItem('trioas_active_role', 'staff');
    localStorage.setItem('trioas_user_staff', JSON.stringify(res.staff));
    setRole('staff');
    setUser(res.staff);
    setToken(res.token);
  };

  const setCustomerSession = (customer: Customer) => {
    localStorage.setItem('trioas_active_role', 'customer');
    localStorage.setItem('trioas_customer_session', JSON.stringify(customer));
    setRole('customer');
    setUser(customer);
  };

  const logout = () => {
    if (role) {
      setStoredToken(role, null);
      localStorage.removeItem(`trioas_user_${role}`);
    }
    localStorage.removeItem('trioas_active_role');
    localStorage.removeItem('trioas_customer_session');
    setRole(null);
    setUser(null);
    setToken(null);
  };

  const refreshUser = async () => {
    if (!role) return;
    try {
      if (role === 'super_admin') {
        const res = await superAdminApi.me();
        setUser(res.superAdmin);
      } else if (role === 'client_admin') {
        const res = await clientAdminApi.me();
        setUser(res.clientAdmin);
      } else if (role === 'staff') {
        const res = await staffApi.me();
        setUser(res.staff);
      }
    } catch (e) {
      console.error('Refresh user error:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        role,
        user,
        token,
        loading,
        loginSuperAdmin,
        loginClientAdmin,
        loginStaff,
        setCustomerSession,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
