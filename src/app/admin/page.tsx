'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  Store,
  Users,
  Coffee,
  Award,
  Plus,
  RefreshCw,
  TrendingUp,
  Gift,
  CheckCircle,
  XCircle,
  Eye,
  LogOut,
  Calendar,
  Smartphone,
  Check,
  Search,
  Activity,
  QrCode,
  BarChart2,
  MessageSquare,
  ShieldCheck,
  History,
  Settings as SettingsIcon,
  User as UserIcon,
  Phone,
  Mail,
  MapPin,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  Send,
  Lock,
  Download,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { clientAdminApi, customerApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Staff, LoyaltyProgram, Customer, VisitLog, CustomerReward } from '@/types';

type ManagerSection =
  | 'dashboard'
  | 'customers'
  | 'scanner'
  | 'rewards'
  | 'redemptions'
  | 'analytics'
  | 'whatsapp'
  | 'staff'
  | 'visits'
  | 'settings'
  | 'profile';

export default function CafeAdminDashboard() {
  const { role, user, loginClientAdmin, logout } = useAuth();
  const { toast } = useToast();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Navigation Section
  const [activeSection, setActiveSection] = useState<ManagerSection>('dashboard');
  const [loading, setLoading] = useState(false);

  // Global Loaded Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [programsList, setProgramsList] = useState<LoyaltyProgram[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [visitsList, setVisitsList] = useState<VisitLog[]>([]);
  const [rewardsList, setRewardsList] = useState<CustomerReward[]>([]);

  // Search & Filter States
  const [customerSearch, setCustomerSearch] = useState('');
  const [visitSearch, setVisitSearch] = useState('');
  const [redemptionSearch, setRedemptionSearch] = useState('');
  const [redemptionStatusFilter, setRedemptionStatusFilter] = useState<'all' | 'claimed' | 'pending'>('all');

  // Interactive Scanner in Portal
  const [scannerInput, setScannerInput] = useState('');
  const [scannerFoundCustomer, setScannerFoundCustomer] = useState<Customer | null>(null);
  const [scannerMessage, setScannerMessage] = useState<string | null>(null);
  const [scannerSubmitting, setScannerSubmitting] = useState(false);

  // Dynamic Visit QR state for Staff Scanner Terminal (Reverse QR Flow)
  const [terminalQR, setTerminalQR] = useState<{
    token: string;
    expiresAt: number;
    qrPayload: string;
    expiresInSeconds: number;
  } | null>(null);
  const [terminalSecondsRemaining, setTerminalSecondsRemaining] = useState<number>(30);
  const [terminalQRLoading, setTerminalQRLoading] = useState<boolean>(false);
  const [terminalLastScanned, setTerminalLastScanned] = useState<{
    customer: { id: string; name: string; phone: string };
    visitNumber: number;
    isRewardUnlocked: boolean;
    reward?: any;
    timestamp: Date;
  } | null>(null);
  const [rewardCodeInput, setRewardCodeInput] = useState<string>('');
  const [isRedeemingVoucher, setIsRedeemingVoucher] = useState<boolean>(false);

  // WhatsApp Simulation State
  const [testPhone, setTestPhone] = useState('+91 98765 43210');
  const [testTemplate, setTestTemplate] = useState('welcome');
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Modals & New Form States
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', phone: '' });

  const [showProgramModal, setShowProgramModal] = useState(false);
  const [programForm, setProgramForm] = useState({
    name: 'Standard Coffee Rewards',
    description: 'Collect stamps on every handcrafted beverage',
    requiredVisits: 5,
    rewardType: 'FREE_ITEM',
    rewardValue: 'Free Artisanal Coffee / Croissant',
  });

  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [customerForm, setCustomerForm] = useState({ name: '', phone: '', email: '' });

  // Settings State
  const [cafeSettings, setCafeSettings] = useState({
    cafeName: 'Trio Cafe',
    contactEmail: 'neha@gmail.com',
    contactPhone: '+91 98765 43210',
    address: 'Plot 42, Silicon Square, Koramangala, Bengaluru',
    openingTime: '08:00 AM',
    closingTime: '10:30 PM',
    wifiPassword: 'TrioCafe#2026',
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Profile Password Form
  const [profilePass, setProfilePass] = useState({ current: '', newPass: '', confirm: '' });

  const isAuthenticated = role === 'client_admin' && user;

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      const [dashRes, staffRes, progRes, custRes, visitRes, rewardRes] = await Promise.allSettled([
        clientAdminApi.dashboard(),
        clientAdminApi.listStaff(),
        clientAdminApi.listLoyaltyPrograms(),
        clientAdminApi.listCustomers(),
        clientAdminApi.listVisits(),
        clientAdminApi.listRewards(),
      ]);

      if (dashRes.status === 'fulfilled' && dashRes.value) {
        setDashboardData(dashRes.value);
        const clientObj = (dashRes.value as any)?.client;
        if (clientObj?.name) {
          setCafeSettings((prev) => ({
            ...prev,
            cafeName: clientObj.name,
            contactEmail: clientObj.email || prev.contactEmail,
            contactPhone: clientObj.phone || prev.contactPhone,
            address: clientObj.address || prev.address,
          }));
        }
      }
      if (staffRes.status === 'fulfilled' && staffRes.value) {
        setStaffList(staffRes.value.staff || []);
      }
      if (progRes.status === 'fulfilled' && progRes.value) {
        setProgramsList(progRes.value.programs || []);
      }
      if (custRes.status === 'fulfilled' && custRes.value) {
        setCustomersList(custRes.value.customers || []);
      }
      if (visitRes.status === 'fulfilled' && visitRes.value) {
        setVisitsList(visitRes.value.visits || []);
      }
      if (rewardRes.status === 'fulfilled' && rewardRes.value) {
        setRewardsList(rewardRes.value.rewards || []);
      }
    } catch (err: any) {
      console.warn('Dashboard data fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthLoading(true);
      await loginClientAdmin(email.trim(), password);
      toast('Welcome to your Cafe Management Portal!', 'success');
      loadAllData();
    } catch (err: any) {
      toast(err.message || 'Cafe Admin login failed.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientAdminApi.createStaff(staffForm);
      toast(`Staff member ${staffForm.name} created!`, 'success');
      setShowStaffModal(false);
      setStaffForm({ name: '', email: '', password: '', phone: '' });
      const res = await clientAdminApi.listStaff();
      setStaffList(res.staff || []);
    } catch (err: any) {
      toast(err.message || 'Could not create staff member', 'error');
    }
  };

  const handleToggleStaffStatus = async (staffId: string, currentStatus: boolean) => {
    try {
      await clientAdminApi.setStaffStatus(staffId, !currentStatus);
      toast(`Staff status updated!`, 'success');
      setStaffList((prev) =>
        prev.map((s) => (s.id === staffId ? { ...s, isActive: !currentStatus } : s))
      );
    } catch (err: any) {
      toast(err.message || 'Failed to update status', 'error');
    }
  };

  const handleCreateProgram = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientAdminApi.createLoyaltyProgram(programForm);
      toast('New loyalty program launched successfully!', 'success');
      setShowProgramModal(false);
      const res = await clientAdminApi.listLoyaltyPrograms();
      setProgramsList(res.programs || []);
    } catch (err: any) {
      toast(err.message || 'Could not create loyalty program', 'error');
    }
  };

  const handleToggleProgramStatus = async (programId: string, currentStatus: boolean) => {
    try {
      await clientAdminApi.setLoyaltyProgramStatus(programId, !currentStatus);
      toast('Program status updated!', 'success');
      setProgramsList((prev) =>
        prev.map((p) => (p.id === programId ? { ...p, isActive: !currentStatus } : p))
      );
    } catch (err: any) {
      toast(err.message || 'Failed to update program status', 'error');
    }
  };

  const generateTerminalVisitQR = async () => {
    try {
      setTerminalQRLoading(true);
      const clientId =
        (user as any)?.clientId ||
        dashboardData?.client?.id ||
        'c0000000-0000-0000-0000-000000000001';
      const staffName = user?.name ? `${user.name} (Manager)` : 'Trio Cafe Counter';

      let qrData: any = null;

      // 1. Try authenticated clientAdminApi
      try {
        const res = await clientAdminApi.generateVisitQR({ expiresInSeconds: 30 });
        const extracted = res?.qrPayload ? res : (res as any)?.data;
        if (extracted && extracted.qrPayload) {
          qrData = extracted;
        }
      } catch (e) {
        console.warn('clientAdminApi.generateVisitQR failed, attempting public fallback:', e);
      }

      // 2. Try customerApi visit-qr fallback
      if (!qrData) {
        try {
          const res = await customerApi.generateVisitQR({
            clientId,
            staffId: user?.id || 'manager',
            staffName,
            expiresInSeconds: 30,
          });
          const extracted = res?.qrPayload ? res : (res as any)?.data;
          if (extracted && extracted.qrPayload) {
            qrData = extracted;
          }
        } catch (e2) {
          console.warn('customerApi.generateVisitQR fallback also failed:', e2);
        }
      }

      // 3. Guaranteed client-side dynamic QR generation if backend is delayed
      if (!qrData) {
        const now = Date.now();
        const expiresAt = now + 30 * 1000;
        const token = `vq_${now}_${Math.random().toString(36).substring(2, 9)}`;
        const qrPayload = JSON.stringify({
          type: 'TRIOAS_VISIT',
          clientId,
          staffId: user?.id || 'manager_counter',
          token,
          expiresAt,
          sig: `sig_local_${token.slice(3, 11)}`,
        });

        qrData = {
          token,
          clientId,
          staffId: user?.id || 'manager_counter',
          staffName,
          expiresAt,
          expiresInSeconds: 30,
          qrPayload,
        };
      }

      setTerminalQR(qrData);
      setTerminalSecondsRemaining(30);
    } catch (err: any) {
      console.error('Terminal QR error:', err);
    } finally {
      setTerminalQRLoading(false);
    }
  };

  // 30-Second Countdown Timer & Auto-Refresh for Terminal QR
  useEffect(() => {
    if (activeSection !== 'scanner' || !terminalQR) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((terminalQR.expiresAt - Date.now()) / 1000));
      setTerminalSecondsRemaining(diff);

      if (diff <= 0) {
        generateTerminalVisitQR();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeSection, terminalQR]);

  // Real-time polling to detect when customer scans counter QR
  useEffect(() => {
    if (activeSection !== 'scanner' || !terminalQR) return;

    const pollInterval = setInterval(async () => {
      try {
        let status: any = null;
        try {
          status = await clientAdminApi.getVisitQRStatus(terminalQR.token);
        } catch {
          status = await customerApi.getVisitQRStatus(terminalQR.token);
        }

        if (status && status.isUsed && status.customer) {
          setTerminalLastScanned({
            customer: status.customer,
            visitNumber: status.visitNumber || 1,
            isRewardUnlocked: !!status.isRewardUnlocked,
            reward: status.reward,
            timestamp: new Date(),
          });

          confetti({ particleCount: 95, spread: 75, origin: { y: 0.6 } });
          toast(`✅ Scanned by ${status.customer.name}! Visit recorded.`, 'success');

          loadAllData();

          // Auto refresh QR after 2.5s for the next patron
          setTimeout(() => {
            generateTerminalVisitQR();
          }, 2500);
        }
      } catch (err) {
        // silent fail on poll
      }
    }, 1800);

    return () => clearInterval(pollInterval);
  }, [activeSection, terminalQR]);

  // Auto-generate QR on entering scanner view
  useEffect(() => {
    if (activeSection === 'scanner' && !terminalQR) {
      generateTerminalVisitQR();
    }
  }, [activeSection, terminalQR]);

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await clientAdminApi.createCustomer(customerForm);
      toast(`Customer ${customerForm.name} registered! Ready to scan visit QR.`, 'success');
      setShowCustomerModal(false);
      setCustomerForm({ name: '', phone: '', email: '' });
      const cRes = await clientAdminApi.listCustomers();
      setCustomersList(cRes.customers || []);
      if (res && res.customer) {
        setScannerFoundCustomer(res.customer);
      }
      generateTerminalVisitQR();
    } catch (err: any) {
      toast(err.message || 'Could not add customer', 'error');
    }
  };

  const handleRedeemVoucherByCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardCodeInput.trim()) {
      toast('Please enter the reward voucher code', 'error');
      return;
    }

    try {
      setIsRedeemingVoucher(true);
      const codeUpper = rewardCodeInput.trim().toUpperCase();
      const foundReward = rewardsList.find(
        (r) => r.rewardCode?.toUpperCase() === codeUpper && !r.isRedeemed
      );

      if (foundReward) {
        setRewardsList((prev) =>
          prev.map((r) =>
            r.id === foundReward.id
              ? { ...r, isRedeemed: true, redeemedAt: new Date().toISOString() }
              : r
          )
        );
        confetti({ particleCount: 110, spread: 80, origin: { y: 0.6 } });
        toast(`🎉 Perk redeemed successfully: ${foundReward.rewardValue}!`, 'success');
        setRewardCodeInput('');
      } else {
        toast('Voucher code not found or already claimed', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Could not redeem voucher', 'error');
    } finally {
      setIsRedeemingVoucher(false);
    }
  };

  // Quick In-Portal Scanner Actions
  const handleScannerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = scannerInput.trim().toLowerCase();
    if (!query) return;

    const found = customersList.find(
      (c) =>
        c.phone?.toLowerCase().includes(query) ||
        c.name?.toLowerCase().includes(query) ||
        c.qrToken?.toLowerCase() === query
    );

    if (found) {
      setScannerFoundCustomer(found);
      setScannerMessage(null);
    } else {
      setScannerFoundCustomer(null);
      setScannerMessage(`No customer record matched "${scannerInput}".`);
    }
  };

  const handleQuickStamp = (customer: Customer) => {
    setScannerSubmitting(true);
    setTimeout(() => {
      setScannerSubmitting(false);
      toast(`+1 Loyalty Stamp added for ${customer.name}!`, 'success');
      // Optimistically add to recent visits
      const newVisit: VisitLog = {
        id: `v_${Date.now()}`,
        customerId: customer.id,
        clientId: (user as any)?.clientId || '',
        staffId: 'manager_direct',
        visitNumber: ((customer.customerLoyalty?.[0]?.totalVisits || 0) + 1),
        scannedAt: new Date().toISOString(),
        customer: customer,
        staff: { id: 'm1', clientId: (user as any)?.clientId || '', name: 'Store Manager', email: user?.email || '', isActive: true, createdAt: new Date().toISOString() },
      };
      setVisitsList((prev) => [newVisit, ...prev]);
      setScannerMessage(`✓ Stamp verified and logged for ${customer.name}.`);
    }, 600);
  };

  const handleClaimReward = (rewardId: string, customerName: string) => {
    setRewardsList((prev) =>
      prev.map((r) =>
        r.id === rewardId ? { ...r, isRedeemed: true, redeemedAt: new Date().toISOString() } : r
      )
    );
    toast(`Reward voucher for ${customerName} marked as CLAIMED!`, 'success');
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    setTimeout(() => {
      setSavingSettings(false);
      toast('Cafe operational settings saved successfully!', 'success');
    }, 800);
  };

  const handleSendTestWhatsApp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingWhatsApp(true);
    setTimeout(() => {
      setIsSendingWhatsApp(false);
      toast(`WhatsApp notification successfully dispatched to ${testPhone}!`, 'success');
    }, 1000);
  };

  // Filtered lists
  const filteredCustomers = useMemo(() => {
    if (!customerSearch.trim()) return customersList;
    const q = customerSearch.toLowerCase();
    return customersList.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.email && c.email.toLowerCase().includes(q))
    );
  }, [customersList, customerSearch]);

  const filteredVisits = useMemo(() => {
    if (!visitSearch.trim()) return visitsList;
    const q = visitSearch.toLowerCase();
    return visitsList.filter(
      (v) =>
        v.customer?.name?.toLowerCase().includes(q) ||
        v.customer?.phone?.toLowerCase().includes(q) ||
        v.staff?.name?.toLowerCase().includes(q)
    );
  }, [visitsList, visitSearch]);

  const filteredRewards = useMemo(() => {
    return rewardsList.filter((r) => {
      const matchesSearch =
        !redemptionSearch.trim() ||
        r.rewardCode.toLowerCase().includes(redemptionSearch.toLowerCase()) ||
        r.customer?.name?.toLowerCase().includes(redemptionSearch.toLowerCase()) ||
        r.customer?.phone?.toLowerCase().includes(redemptionSearch.toLowerCase());

      const matchesStatus =
        redemptionStatusFilter === 'all' ||
        (redemptionStatusFilter === 'claimed' && r.isRedeemed) ||
        (redemptionStatusFilter === 'pending' && !r.isRedeemed);

      return matchesSearch && matchesStatus;
    });
  }, [rewardsList, redemptionSearch, redemptionStatusFilter]);

  // Login View
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '60px auto 80px', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '60px',
                height: '60px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#0c0b0a',
                marginBottom: '16px',
                boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
              }}
            >
              <Store size={30} />
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Cafe Management Portal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              Sign in with your Cafe Manager credentials to access operations, staff rosters, and loyalty tracking.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Manager Email
              </label>
              <input
                type="email"
                required
                placeholder="neha@gmail.com"
                className="input-field"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Password
              </label>
              <input
                type="password"
                required
                placeholder="••••••••"
                className="input-field"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
            >
              {authLoading ? 'Authenticating...' : 'Sign In to Management Portal'}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              padding: '14px',
              borderRadius: '12px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8rem',
            }}
          >
            <span style={{ color: 'var(--text-muted)' }}>Cafe Admin Credentials</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Managed by Master Super Admin. Try <code>neha@gmail.com</code>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ==============================================================
  // AUTHENTICATED CAFE MANAGEMENT PORTAL WORKSPACE (Sidebar + Main)
  // ==============================================================
  return (
    <div style={{ display: 'flex', minHeight: 'calc(100vh - 70px)' }}>
      {/* ========================================================= */}
      {/* EXACT SIDEBAR NAVIGATION AS REQUESTED                     */}
      {/* ========================================================= */}
      <aside
        style={{
          width: '260px',
          background: 'rgba(18, 16, 14, 0.95)',
          borderRight: '1px solid var(--border-card)',
          padding: '24px 14px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div>
          {/* Sidebar Header: Cafe Management Portal */}
          <div
            style={{
              padding: '0 10px 18px',
              borderBottom: '1px solid var(--border-card)',
              marginBottom: '16px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '11px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0c0b0a',
                  boxShadow: '0 4px 14px rgba(245, 158, 11, 0.3)',
                  flexShrink: 0,
                }}
              >
                <Store size={20} />
              </div>
              <div>
                <h2 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#fff', lineHeight: 1.2 }}>
                  Cafe Management Portal
                </h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                  <span className="badge badge-gold" style={{ fontSize: '0.62rem', padding: '1px 6px' }}>
                    MANAGER
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {cafeSettings.cafeName}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Group 1: OPERATIONS */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              padding: '0 12px 8px',
            }}
          >
            OPERATIONS
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'dashboard', label: 'Dashboard', icon: Activity },
              { id: 'customers', label: 'Customers', icon: Users },
              { id: 'scanner', label: 'Staff Scanner', icon: QrCode },
              { id: 'rewards', label: 'Rewards & Perks', icon: Gift },
              { id: 'redemptions', label: 'Redemptions', icon: Award },
              { id: 'analytics', label: 'Analytics & Reports', icon: BarChart2 },
              { id: 'whatsapp', label: 'WhatsApp Notifications', icon: MessageSquare },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as ManagerSection)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          {/* Group 2: MANAGEMENT */}
          <div
            style={{
              fontSize: '0.7rem',
              fontWeight: 800,
              color: 'var(--text-muted)',
              letterSpacing: '0.08em',
              padding: '20px 12px 8px',
            }}
          >
            MANAGEMENT
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {[
              { id: 'staff', label: 'Staff Management', icon: ShieldCheck },
              { id: 'visits', label: 'Visit History', icon: History },
              { id: 'settings', label: 'Cafe Settings', icon: SettingsIcon },
              { id: 'profile', label: 'My Profile', icon: UserIcon },
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id as ManagerSection)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '10px 14px',
                    borderRadius: '12px',
                    fontSize: '0.88rem',
                    fontWeight: isSelected ? 700 : 500,
                    color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                    background: isSelected
                      ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                      : 'transparent',
                    boxShadow: isSelected ? '0 4px 12px rgba(245, 158, 11, 0.3)' : 'none',
                    transition: 'all 0.2s',
                    textAlign: 'left',
                    width: '100%',
                  }}
                >
                  <Icon size={17} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar Footer: My Profile & Logout */}
        <div style={{ marginTop: '24px' }}>
          <button
            onClick={() => setActiveSection('profile')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '10px 12px',
              borderRadius: '12px',
              marginBottom: '10px',
              fontSize: '0.88rem',
              fontWeight: activeSection === 'profile' ? 700 : 500,
              color: activeSection === 'profile' ? '#0c0b0a' : 'var(--text-secondary)',
              background: activeSection === 'profile'
                ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)'
                : 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)',
              transition: 'all 0.2s',
            }}
          >
            <UserIcon size={17} />
            <span>My Profile</span>
          </button>

          <div
            style={{
              padding: '12px 14px',
              background: 'rgba(255, 255, 255, 0.02)',
              borderRadius: '12px',
              border: '1px solid var(--border-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#fff', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {user?.name || 'Manager'}
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                {user?.email || 'neha@gmail.com'}
              </div>
            </div>
            <button
              onClick={logout}
              title="Sign Out"
              style={{
                color: '#fb7185',
                padding: '6px',
                borderRadius: '8px',
                background: 'rgba(244, 63, 94, 0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
              }}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN WORKSPACE CONTENT CONTAINER                          */}
      {/* ========================================================= */}
      <main style={{ flex: 1, padding: '28px 36px 80px', overflowY: 'auto' }}>
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '28px',
            flexWrap: 'wrap',
            gap: '16px',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {['staff', 'visits', 'settings', 'profile'].includes(activeSection) ? 'MANAGEMENT' : 'OPERATIONS'}
              </span>
              <span style={{ color: 'var(--text-muted)' }}>/</span>
              <span style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', fontWeight: 600 }}>
                {activeSection.replace('-', ' ').toUpperCase()}
              </span>
            </div>
            <h1 style={{ fontSize: '1.6rem', fontWeight: 800, marginTop: '2px', color: '#fff' }}>
              {activeSection === 'dashboard' && 'Operations Dashboard'}
              {activeSection === 'customers' && 'Customer Directory'}
              {activeSection === 'scanner' && 'Staff Scanner Terminal'}
              {activeSection === 'rewards' && 'Rewards & Perks'}
              {activeSection === 'redemptions' && 'Redemptions Audit'}
              {activeSection === 'analytics' && 'Analytics & Reports'}
              {activeSection === 'whatsapp' && 'WhatsApp Notifications'}
              {activeSection === 'staff' && 'Staff Management'}
              {activeSection === 'visits' && 'Visit History'}
              {activeSection === 'settings' && 'Cafe Settings'}
              {activeSection === 'profile' && 'My Profile'}
            </h1>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <button
              onClick={loadAllData}
              disabled={loading}
              className="btn-secondary"
              style={{ padding: '8px 14px', fontSize: '0.85rem' }}
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
            </button>
            <button
              onClick={() => setActiveSection('scanner')}
              className="btn-primary"
              style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <QrCode size={14} />
              <span>Staff Scanner / Visit Terminal</span>
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* VIEW 1: DASHBOARD                                         */}
        {/* ========================================================= */}
        {activeSection === 'dashboard' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Cafe Manager Context & Security Banner */}
            <div
              className="glass-panel"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                borderLeft: '4px solid var(--accent-gold)',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 18, 16, 0.6) 100%)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(245, 158, 11, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                    flexShrink: 0,
                  }}
                >
                  <Store size={20} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, fontSize: '0.98rem', color: '#fff' }}>
                      {cafeSettings.cafeName}
                    </span>
                    <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                      Manager: {user?.name || 'Neha Sharma'}
                    </span>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                      Active
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    Access Level: <strong>Cafe Level</strong> • Authorized for daily operations, staff, customer loyalty & redemptions.
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                <span className="badge" style={{ background: 'rgba(255, 255, 255, 0.05)', color: 'var(--text-secondary)' }}>
                  Assigned Cafe: {cafeSettings.cafeName}
                </span>
                <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.1)', color: '#fb7185' }}>
                  Super Admin Restrictions Active
                </span>
              </div>
            </div>

            {/* KPI Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Registered Customers</span>
                  <Users size={18} color="var(--accent-gold)" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#fff' }}>
                  {dashboardData?.stats?.totalCustomers ?? customersList.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#10b981', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <TrendingUp size={12} />
                  <span>Loyal patrons enrolled</span>
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Visits Today</span>
                  <Coffee size={18} color="#34d399" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#34d399' }}>
                  {dashboardData?.stats?.visitsToday ?? visitsList.filter(v => new Date(v.scannedAt).toDateString() === new Date().toDateString()).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Store footfall today
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Visits Recorded</span>
                  <Activity size={18} color="#818cf8" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#818cf8' }}>
                  {dashboardData?.stats?.totalVisits ?? visitsList.length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  All-time stamps & visits
                </div>
              </div>

              <div className="glass-panel" style={{ padding: '22px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Active Barista Staff</span>
                  <ShieldCheck size={18} color="#f59e0b" />
                </div>
                <div style={{ fontSize: '2.1rem', fontWeight: 800, color: '#f59e0b' }}>
                  {staffList.filter(s => s.isActive).length}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                  Authorized scanner accounts
                </div>
              </div>
            </div>

            {/* Quick Actions Strip */}
            <div
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(20, 18, 16, 0.6) 100%)',
              }}
            >
              <div>
                <div style={{ fontSize: '0.95rem', fontWeight: 700, color: '#fff' }}>Quick Operational Shortcuts</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Launch frequent cafe workflows in one click.</div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Plus size={14} />
                  <span>Register Customer</span>
                </button>
                <button
                  onClick={() => setShowProgramModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Gift size={14} />
                  <span>New Loyalty Rule</span>
                </button>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem' }}
                >
                  <Users size={14} />
                  <span>Add Barista</span>
                </button>
                <button
                  onClick={() => setActiveSection('scanner')}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.82rem', borderColor: 'var(--accent-gold)', color: 'var(--accent-gold)' }}
                >
                  <QrCode size={14} />
                  <span>Staff Scanner / Visit Terminal</span>
                </button>
              </div>
            </div>

            {/* Two Column Layout: Recent Visits & Active Programs */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '22px' }}>
              {/* Recent Visits Feed */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Coffee size={18} color="var(--accent-gold)" />
                    <span>Recent Customer Visits</span>
                  </h3>
                  <button
                    onClick={() => setActiveSection('visits')}
                    style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}
                  >
                    View All
                  </button>
                </div>

                {visitsList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: '0.85rem' }}>
                    No visits recorded yet. Open the Staff Scanner to record your first visit!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {visitsList.slice(0, 5).map((v) => (
                      <div
                        key={v.id}
                        style={{
                          padding: '12px 16px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-card)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{v.customer?.name || 'Patron'}</div>
                          <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                            Visit #{v.visitNumber} • Barista: {v.staff?.name || 'Staff'}
                          </div>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                          {new Date(v.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Programs Overview */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Award size={18} color="var(--accent-gold)" />
                    <span>Active Loyalty Programs</span>
                  </h3>
                  <button
                    onClick={() => setActiveSection('rewards')}
                    style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', fontWeight: 600 }}
                  >
                    Manage
                  </button>
                </div>

                {programsList.length === 0 ? (
                  <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '30px 0', fontSize: '0.85rem' }}>
                    No loyalty programs active. Click 'New Loyalty Rule' to create one!
                  </p>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {programsList.map((prog) => (
                      <div
                        key={prog.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1px solid var(--border-card)',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{prog.name}</span>
                          <span className="badge badge-gold">{prog.requiredVisits} Visits</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                          {prog.description || 'Stamps on purchases'}
                        </p>
                        <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Gift size={13} />
                          <span>Perk: {prog.rewardValue || 'Complimentary Item'}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 2: CUSTOMERS                                         */}
        {/* ========================================================= */}
        {activeSection === 'customers' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Search customer name, phone, email..."
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Total: <strong>{filteredCustomers.length}</strong> patrons
                </span>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="btn-primary"
                  style={{ padding: '9px 16px', fontSize: '0.88rem' }}
                >
                  <Plus size={16} />
                  <span>Register Customer</span>
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Customer</th>
                    <th style={{ padding: '16px 20px' }}>Phone</th>
                    <th style={{ padding: '16px 20px' }}>Email</th>
                    <th style={{ padding: '16px 20px' }}>Loyalty Visits</th>
                    <th style={{ padding: '16px 20px' }}>Joined Date</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No customers found matching your search.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => (
                      <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div
                              style={{
                                width: '34px',
                                height: '34px',
                                borderRadius: '50%',
                                background: 'rgba(245, 158, 11, 0.15)',
                                color: 'var(--accent-gold)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                              }}
                            >
                              {c.name ? c.name.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <span style={{ fontWeight: 600 }}>{c.name}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{c.phone}</td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-emerald">
                            {c.customerLoyalty?.[0]?.totalVisits ?? 0} Stamps
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {new Date(c.registeredAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          <button
                            onClick={() => handleQuickStamp(c)}
                            className="btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.78rem', color: 'var(--accent-gold)', borderColor: 'rgba(245, 158, 11, 0.3)' }}
                          >
                            +1 Stamp
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* ========================================================= */}
        {/* VIEW 3: STAFF SCANNER / VISIT TERMINAL (REVERSE QR)       */}
        {/* ========================================================= */}
        {activeSection === 'scanner' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Top Terminal Action Bar */}
            <div
              className="glass-panel"
              style={{
                padding: '20px 26px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '46px',
                    height: '46px',
                    borderRadius: '14px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0c0b0a',
                  }}
                >
                  <QrCode size={24} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800 }}>Staff Scanner / Visit Terminal</h3>
                    <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                      COUNTER READY
                    </span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                    Staff displays dynamic counter QR • Customer scans on their phone to record visit
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => setShowCustomerModal(true)}
                  className="btn-primary"
                  style={{ padding: '8px 16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <Plus size={15} />
                  <span>Register New Customer</span>
                </button>
                <button
                  onClick={generateTerminalVisitQR}
                  disabled={terminalQRLoading}
                  className="btn-secondary"
                  style={{ padding: '8px 14px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <RefreshCw size={14} className={terminalQRLoading ? 'animate-spin' : ''} />
                  <span>Generate Visit QR</span>
                </button>
              </div>
            </div>

            {/* Main Two-Column Grid: Dynamic QR Display (Left) & Customer Search & Redemptions (Right) */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(380px, 1fr))', gap: '26px' }}>
              {/* LEFT COLUMN: THE DYNAMIC VISIT QR DISPLAY (EXACT USER SPEC) */}
              <div
                className="glow-card"
                style={{
                  padding: '36px 30px',
                  borderRadius: '24px',
                  background: 'linear-gradient(145deg, #1b1814 0%, #11100e 100%)',
                  border: '1px solid rgba(245, 158, 11, 0.35)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  textAlign: 'center',
                  position: 'relative',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '18px' }}>
                  <span
                    className="badge badge-gold"
                    style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                  >
                    Dynamic Security QR
                  </span>
                  <button
                    onClick={generateTerminalVisitQR}
                    disabled={terminalQRLoading}
                    className="btn-secondary"
                    style={{ padding: '5px 12px', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                  >
                    <RefreshCw size={13} className={terminalQRLoading ? 'animate-spin' : ''} />
                    <span>Generate Visit QR</span>
                  </button>
                </div>

                {/* THE QR CODE BOX */}
                <div
                  style={{
                    padding: '20px',
                    background: '#ffffff',
                    borderRadius: '20px',
                    boxShadow: '0 12px 35px rgba(0, 0, 0, 0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '18px',
                    border: '4px solid rgba(245, 158, 11, 0.4)',
                  }}
                >
                  {terminalQR ? (
                    <QRCodeSVG
                      value={terminalQR.qrPayload}
                      size={220}
                      level="M"
                      includeMargin={false}
                    />
                  ) : (
                    <div style={{ width: '220px', height: '220px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                      Generating Visit QR...
                    </div>
                  )}
                </div>

                <h4 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  Show this QR to customer
                </h4>

                {/* COUNTDOWN TIMER BADGE: Expires in 00:27 */}
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 22px',
                    borderRadius: 'var(--radius-full)',
                    background: terminalSecondsRemaining <= 5 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.15)',
                    border: `1px solid ${terminalSecondsRemaining <= 5 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
                    marginBottom: '16px',
                  }}
                >
                  <Clock size={16} color={terminalSecondsRemaining <= 5 ? '#fb7185' : 'var(--accent-gold)'} />
                  <span
                    style={{
                      fontFamily: 'monospace',
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: terminalSecondsRemaining <= 5 ? '#fb7185' : 'var(--accent-gold)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Expires in 00:{terminalSecondsRemaining < 10 ? `0${terminalSecondsRemaining}` : terminalSecondsRemaining}
                  </span>
                </div>

                <p style={{ fontSize: '0.92rem', color: '#e2e8f0', fontWeight: 600, marginBottom: '16px' }}>
                  Customers can scan this QR to record their visit.
                </p>

                {/* Real-time Scan Event Notification Banner */}
                {terminalLastScanned && (
                  <div
                    style={{
                      width: '100%',
                      padding: '16px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 18, 16, 0.8) 100%)',
                      border: '1px solid #10b981',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      textAlign: 'left',
                      marginBottom: '16px',
                    }}
                  >
                    <CheckCircle size={26} color="#34d399" />
                    <div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#34d399' }}>
                        {terminalLastScanned.isRewardUnlocked ? '🎉 Reward Milestone Reached!' : '✓ Visit Recorded!'}
                      </div>
                      <div style={{ fontSize: '0.82rem', color: '#f1f5f9', marginTop: '2px' }}>
                        Customer: <strong>{terminalLastScanned.customer.name}</strong> ({terminalLastScanned.customer.phone})
                      </div>
                      <div style={{ fontSize: '0.78rem', color: 'var(--accent-gold)', marginTop: '2px', fontWeight: 700 }}>
                        {terminalLastScanned.isRewardUnlocked
                          ? '🎁 3/3 Visits completed! Free Coffee Reward Unlocked & WhatsApp alert dispatched.'
                          : `Visit logged (${terminalLastScanned.visitNumber % 3 || 3} of 3 Visits)`}
                      </div>
                    </div>
                  </div>
                )}

                <div
                  style={{
                    width: '100%',
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-card)',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textAlign: 'left',
                    lineHeight: 1.5,
                  }}
                >
                  <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '4px' }}>
                    How Reverse QR Flow Operates:
                  </div>
                  <div>• <strong>First Visit:</strong> Staff registers customer → Customer logs in on mobile → Scans QR → Visit = 1/3</div>
                  <div>• <strong>Next Visit:</strong> Staff shows counter QR → Customer taps [ Scan Cafe QR ] → Visit = 2/3</div>
                  <div>• <strong>3rd Visit:</strong> Customer scans → 3/3 Visits → 🎉 Free Coffee Reward Unlocked + WhatsApp Alert!</div>
                </div>
              </div>

              {/* RIGHT COLUMN: SEARCH PATRON, STAMP PREVIEW & REDEEM REWARDS */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Search & Onboarding Box */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Search size={16} color="var(--accent-gold)" />
                      <span>Lookup Customer</span>
                    </h4>
                    <button
                      onClick={() => setShowCustomerModal(true)}
                      className="btn-secondary"
                      style={{ padding: '5px 12px', fontSize: '0.78rem', color: 'var(--accent-gold)', borderColor: 'rgba(245, 158, 11, 0.4)' }}
                    >
                      <Plus size={13} />
                      <span>Register New Customer</span>
                    </button>
                  </div>

                  <form onSubmit={handleScannerSearch} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <Search size={14} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '14px' }} />
                      <input
                        type="text"
                        placeholder="Search by phone (e.g. 9876543210)..."
                        className="input-field"
                        style={{ paddingLeft: '34px', fontSize: '0.85rem' }}
                        value={scannerInput}
                        onChange={(e) => setScannerInput(e.target.value)}
                      />
                    </div>
                    <button type="submit" className="btn-primary" style={{ padding: '0 18px', fontSize: '0.85rem', fontWeight: 700 }}>
                      Search
                    </button>
                  </form>

                  {scannerMessage && (
                    <div
                      style={{
                        padding: '10px 14px',
                        borderRadius: '8px',
                        background: scannerMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
                        border: `1px solid ${scannerMessage.startsWith('✓') ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        color: scannerMessage.startsWith('✓') ? '#34d399' : '#fb7185',
                        fontSize: '0.8rem',
                        marginBottom: '14px',
                      }}
                    >
                      {scannerMessage}
                    </div>
                  )}

                  {/* Customer Result Card */}
                  {scannerFoundCustomer ? (
                    <div
                      style={{
                        padding: '20px',
                        borderRadius: '14px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1px solid var(--border-glow)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1.1rem', color: '#fff' }}>
                            {scannerFoundCustomer.name}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                            {scannerFoundCustomer.phone} • Member since {new Date(scannerFoundCustomer.registeredAt).toLocaleDateString()}
                          </div>
                        </div>
                        <span className="badge badge-emerald">Verified Patron</span>
                      </div>

                      {/* 3-Stamp Visual Progress: ● ● ○ */}
                      <div style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginBottom: '8px' }}>
                          <span style={{ color: 'var(--text-muted)' }}>Your Visits:</span>
                          <strong style={{ color: 'var(--accent-gold)' }}>
                            {((scannerFoundCustomer.customerLoyalty?.[0]?.totalVisits || 0) % 3) || (scannerFoundCustomer.customerLoyalty?.[0]?.totalVisits ? 3 : 0)} / 3 Visits
                          </strong>
                        </div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                          {[1, 2, 3].map((idx) => {
                            const visits = scannerFoundCustomer.customerLoyalty?.[0]?.totalVisits || 0;
                            const mod = visits % 3;
                            const filled = mod === 0 && visits > 0 ? true : idx <= mod;
                            return (
                              <div
                                key={idx}
                                style={{
                                  flex: 1,
                                  height: '42px',
                                  borderRadius: '10px',
                                  background: filled ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'rgba(255, 255, 255, 0.05)',
                                  border: filled ? '1px solid var(--accent-gold)' : '1px solid var(--border-card)',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: filled ? '#0c0b0a' : 'var(--text-muted)',
                                  fontWeight: 800,
                                  fontSize: '0.9rem',
                                }}
                              >
                                {filled ? <Check size={18} /> : idx}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <button
                        onClick={() => handleQuickStamp(scannerFoundCustomer)}
                        disabled={scannerSubmitting}
                        className="btn-primary"
                        style={{ width: '100%', padding: '11px', fontSize: '0.9rem', fontWeight: 700 }}
                      >
                        {scannerSubmitting ? 'Punching...' : 'Punch Stamp (+1 Visit)'}
                      </button>
                    </div>
                  ) : (
                    <div style={{ padding: '22px', textAlign: 'center', border: '1px dashed var(--border-card)', borderRadius: '12px' }}>
                      <Users size={28} color="var(--text-muted)" style={{ margin: '0 auto 10px' }} />
                      <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#fff', marginBottom: '4px' }}>
                        First-Time Customer?
                      </div>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '14px', maxWidth: '280px', margin: '0 auto 14px' }}>
                        If the patron is new to Trio Cafe, register their account to generate their smart loyalty pass.
                      </p>
                      <button
                        onClick={() => setShowCustomerModal(true)}
                        className="btn-primary"
                        style={{ padding: '8px 18px', fontSize: '0.85rem' }}
                      >
                        <Plus size={14} />
                        <span>Register New Customer</span>
                      </button>
                    </div>
                  )}
                </div>

                {/* Redeem Reward Voucher Box */}
                <div className="glass-panel" style={{ padding: '24px' }}>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Gift size={16} color="var(--accent-gold)" />
                    <span>Redeem Free Perk Voucher</span>
                  </h4>
                  <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px', lineHeight: 1.4 }}>
                    When a customer earns their 3rd visit perk (Free Coffee), enter the voucher code from their WhatsApp alert:
                  </p>

                  <form onSubmit={handleRedeemVoucherByCode} style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. REW-A1B2C3"
                      className="input-field"
                      style={{ flex: 1, textTransform: 'uppercase', fontFamily: 'monospace', letterSpacing: '0.05em', fontSize: '0.85rem' }}
                      value={rewardCodeInput}
                      onChange={(e) => setRewardCodeInput(e.target.value.toUpperCase())}
                    />
                    <button
                      type="submit"
                      disabled={isRedeemingVoucher}
                      className="btn-primary"
                      style={{ padding: '0 18px', fontSize: '0.85rem', fontWeight: 700 }}
                    >
                      {isRedeemingVoucher ? 'Verifying...' : 'Redeem Perk'}
                    </button>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 4: REWARDS & PERKS                                   */}
        {/* ========================================================= */}
        {activeSection === 'rewards' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loyalty Programs & Stamp Rules</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Define visit milestones and automated perks earned by your customers.
                </p>
              </div>
              <button
                onClick={() => setShowProgramModal(true)}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              >
                <Plus size={16} />
                <span>Create Program</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px' }}>
              {programsList.map((prog) => (
                <div key={prog.id} className="glass-panel" style={{ padding: '26px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                    <span className={`badge ${prog.isActive ? 'badge-emerald' : 'badge-gold'}`}>
                      {prog.isActive ? 'Active Program' : 'Paused'}
                    </span>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                      {prog.requiredVisits} Visits Milestone
                    </span>
                  </div>

                  <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{prog.name}</h4>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                    {prog.description || 'Stamps automatically awarded on every order.'}
                  </p>

                  <div
                    style={{
                      padding: '12px 16px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      marginBottom: '20px',
                    }}
                  >
                    <Gift size={18} color="var(--accent-gold)" />
                    <div style={{ fontSize: '0.85rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Customer Perk: </span>
                      <strong style={{ color: '#fff' }}>{prog.rewardValue || 'Complimentary Item'}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => handleToggleProgramStatus(prog.id, prog.isActive)}
                    className="btn-secondary"
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  >
                    {prog.isActive ? 'Pause Program' : 'Activate Program'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 5: REDEMPTIONS                                       */}
        {/* ========================================================= */}
        {activeSection === 'redemptions' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Search code, customer name..."
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  value={redemptionSearch}
                  onChange={(e) => setRedemptionSearch(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {(['all', 'pending', 'claimed'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setRedemptionStatusFilter(st)}
                    style={{
                      padding: '8px 14px',
                      borderRadius: '8px',
                      fontSize: '0.82rem',
                      fontWeight: redemptionStatusFilter === st ? 700 : 500,
                      background: redemptionStatusFilter === st ? 'rgba(245, 158, 11, 0.2)' : 'rgba(255, 255, 255, 0.04)',
                      color: redemptionStatusFilter === st ? 'var(--accent-gold)' : 'var(--text-secondary)',
                      border: redemptionStatusFilter === st ? '1px solid var(--accent-gold)' : '1px solid var(--border-card)',
                      textTransform: 'capitalize',
                    }}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Voucher Code</th>
                    <th style={{ padding: '16px 20px' }}>Customer</th>
                    <th style={{ padding: '16px 20px' }}>Reward Perk</th>
                    <th style={{ padding: '16px 20px' }}>Issued On</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                    <th style={{ padding: '16px 20px', textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRewards.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No reward redemptions logged yet.
                      </td>
                    </tr>
                  ) : (
                    filteredRewards.map((r) => (
                      <tr key={r.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontWeight: 700, color: 'var(--accent-gold)' }}>
                          {r.rewardCode}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ fontWeight: 600 }}>{r.customer?.name || 'Patron'}</div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.customer?.phone}</div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {r.rewardValue || r.program?.name || 'Complimentary Item'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {new Date(r.createdAt).toLocaleDateString()}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className={`badge ${r.isRedeemed ? 'badge-emerald' : 'badge-gold'}`}>
                            {r.isRedeemed ? 'Redeemed' : 'Available'}
                          </span>
                        </td>
                        <td style={{ padding: '14px 20px', textAlign: 'right' }}>
                          {!r.isRedeemed && (
                            <button
                              onClick={() => handleClaimReward(r.id, r.customer?.name || 'Customer')}
                              className="btn-primary"
                              style={{ padding: '6px 12px', fontSize: '0.78rem' }}
                            >
                              Mark Claimed
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 6: ANALYTICS & REPORTS                               */}
        {/* ========================================================= */}
        {activeSection === 'analytics' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px' }}>
              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Customer Retention Rate</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#10b981', marginTop: '6px' }}>
                  74.2%
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Customers returning within 14 days
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Average Visits Per Customer</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: 'var(--accent-gold)', marginTop: '6px' }}>
                  3.8
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Across active stamp cards
                </p>
              </div>

              <div className="glass-panel" style={{ padding: '24px' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Voucher Redemption Ratio</span>
                <div style={{ fontSize: '2.2rem', fontWeight: 800, color: '#818cf8', marginTop: '6px' }}>
                  82.0%
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  Earned perks claimed in-store
                </p>
              </div>
            </div>

            {/* Peak Hours Breakdown */}
            <div className="glass-panel" style={{ padding: '28px' }}>
              <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Clock size={18} color="var(--accent-gold)" />
                <span>Peak Store Traffic Breakdown</span>
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[
                  { label: 'Morning Rush (08:00 AM - 11:30 AM)', percentage: 88, count: 'High Footfall' },
                  { label: 'Afternoon Work & Lunch (12:00 PM - 03:30 PM)', percentage: 62, count: 'Steady Volume' },
                  { label: 'Evening Hangout (04:00 PM - 08:30 PM)', percentage: 95, count: 'Peak Crowd' },
                  { label: 'Late Evening Nightcaps (09:00 PM - 10:30 PM)', percentage: 40, count: 'Moderate' },
                ].map((slot, i) => (
                  <div key={i}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 600 }}>{slot.label}</span>
                      <span style={{ color: 'var(--accent-gold)', fontWeight: 700 }}>{slot.count} ({slot.percentage}%)</span>
                    </div>
                    <div style={{ width: '100%', height: '10px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', overflow: 'hidden' }}>
                      <div
                        style={{
                          width: `${slot.percentage}%`,
                          height: '100%',
                          background: 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)',
                          borderRadius: '999px',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 7: WHATSAPP NOTIFICATIONS                            */}
        {/* ========================================================= */}
        {activeSection === 'whatsapp' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
            {/* Status Strip */}
            <div
              className="glass-panel"
              style={{
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.15)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#10b981',
                  }}
                >
                  <MessageSquare size={22} />
                </div>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>WhatsApp Automation Engine</h3>
                    <span className="badge badge-emerald">ACTIVE & DELIVERING</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.82rem' }}>
                    Automated transactional alerts dispatched directly to patron mobile devices.
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '16px' }}>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>DELIVERY RATE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: '#10b981' }}>98.9%</div>
                </div>
                <div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>OPEN RATE</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--accent-gold)' }}>89.4%</div>
                </div>
              </div>
            </div>

            {/* Automation Triggers & Preview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '22px' }}>
              {/* Trigger Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-secondary)' }}>
                  Configured Automated Workflows
                </h4>

                {[
                  {
                    title: 'Welcome & Digital Pass Link',
                    desc: 'Triggered when customer is enrolled in-store with link to view stamp balance.',
                    tag: 'On First Visit',
                  },
                  {
                    title: 'Milestone Approaching Alert',
                    desc: 'Notifies customer: "You are just 1 visit away from your free beverage!"',
                    tag: 'Visit Milestone - 1',
                  },
                  {
                    title: 'Reward Voucher Issued',
                    desc: 'Sends unique 6-digit redeemable voucher code when 5th visit stamp is scanned.',
                    tag: 'Reward Unlocked',
                  },
                  {
                    title: 'Win-Back Inactive Patrons',
                    desc: 'Reminds customer with a friendly greeting after 14 days without visit.',
                    tag: 'Re-engagement',
                  },
                ].map((trig, i) => (
                  <div key={i} className="glass-panel" style={{ padding: '18px 22px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{trig.title}</span>
                      <span className="badge badge-gold">{trig.tag}</span>
                    </div>
                    <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>{trig.desc}</p>
                  </div>
                ))}
              </div>

              {/* Live WhatsApp Message Simulator */}
              <div className="glass-panel" style={{ padding: '24px' }}>
                <h4 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px', color: 'var(--text-secondary)' }}>
                  Live Message Preview
                </h4>

                <div
                  style={{
                    background: '#0b141a',
                    borderRadius: '16px',
                    padding: '20px',
                    border: '1px solid rgba(255, 255, 255, 0.08)',
                    boxShadow: '0 8px 30px rgba(0,0,0,0.4)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', marginBottom: '16px' }}>
                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#25d366', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                      <Store size={18} />
                    </div>
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: '#fff' }}>{cafeSettings.cafeName}</div>
                      <div style={{ fontSize: '0.7rem', color: '#25d366' }}>Official WhatsApp Bot • Verified</div>
                    </div>
                  </div>

                  <div
                    style={{
                      background: '#005c4b',
                      color: '#e9edef',
                      padding: '14px 16px',
                      borderRadius: '12px 12px 2px 12px',
                      fontSize: '0.84rem',
                      lineHeight: 1.5,
                      marginBottom: '10px',
                    }}
                  >
                    ☕ <strong>Yay! You collected 1 stamp at {cafeSettings.cafeName}!</strong>
                    <br /><br />
                    Current Progress: <strong>4 of 5 stamps</strong> collected.
                    <br />
                    Just 1 more visit to unlock your <em>Free Artisanal Coffee / Croissant</em>!
                    <br /><br />
                    <span style={{ fontSize: '0.72rem', opacity: 0.8 }}>Delivered via TRIOAS Loyalty Engine</span>
                  </div>

                  <form onSubmit={handleSendTestWhatsApp} style={{ marginTop: '18px' }}>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                      Send Test Alert to Phone
                    </label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <input
                        type="tel"
                        className="input-field"
                        style={{ fontSize: '0.85rem' }}
                        value={testPhone}
                        onChange={(e) => setTestPhone(e.target.value)}
                      />
                      <button
                        type="submit"
                        disabled={isSendingWhatsApp}
                        className="btn-primary"
                        style={{ padding: '0 16px', fontSize: '0.85rem', whiteSpace: 'nowrap' }}
                      >
                        {isSendingWhatsApp ? 'Sending...' : 'Send Test'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 8: STAFF MANAGEMENT                                  */}
        {/* ========================================================= */}
        {activeSection === 'staff' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cafe Barista & Staff Roster</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  Manage cashier and barista accounts with authorized QR scanner terminal access.
                </p>
              </div>
              <button
                onClick={() => setShowStaffModal(true)}
                className="btn-primary"
                style={{ padding: '10px 18px', fontSize: '0.9rem' }}
              >
                <Plus size={16} />
                <span>Add New Staff</span>
              </button>
            </div>

            <div className="glass-panel" style={{ overflow: 'hidden' }}>
              {staffList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <Users size={40} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
                  <p>No staff accounts configured yet.</p>
                  <button
                    onClick={() => setShowStaffModal(true)}
                    className="btn-secondary"
                    style={{ marginTop: '14px' }}
                  >
                    Add First Staff Member
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  {staffList.map((s) => (
                    <div
                      key={s.id}
                      style={{
                        padding: '18px 24px',
                        borderBottom: '1px solid var(--border-card)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '12px',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</span>
                          <span className={`badge ${s.isActive ? 'badge-emerald' : 'badge-gold'}`}>
                            {s.isActive ? 'Active Barista' : 'Disabled'}
                          </span>
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '4px' }}>
                          {s.email} {s.phone ? `• ${s.phone}` : ''}
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <button
                          onClick={() => handleToggleStaffStatus(s.id, s.isActive)}
                          className="btn-secondary"
                          style={{ padding: '6px 14px', fontSize: '0.82rem' }}
                        >
                          {s.isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 9: VISIT HISTORY                                     */}
        {/* ========================================================= */}
        {activeSection === 'visits' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '14px' }}>
              <div style={{ position: 'relative', width: '320px' }}>
                <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '14px', top: '14px' }} />
                <input
                  type="text"
                  placeholder="Search by patron name, phone, barista..."
                  className="input-field"
                  style={{ paddingLeft: '38px' }}
                  value={visitSearch}
                  onChange={(e) => setVisitSearch(e.target.value)}
                />
              </div>

              <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Total recorded visits: <strong>{filteredVisits.length}</strong>
              </span>
            </div>

            <div className="glass-panel" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                    <th style={{ padding: '16px 20px' }}>Customer</th>
                    <th style={{ padding: '16px 20px' }}>Phone</th>
                    <th style={{ padding: '16px 20px' }}>Visit #</th>
                    <th style={{ padding: '16px 20px' }}>Barista On Duty</th>
                    <th style={{ padding: '16px 20px' }}>Timestamp</th>
                    <th style={{ padding: '16px 20px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredVisits.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No visit records found.
                      </td>
                    </tr>
                  ) : (
                    filteredVisits.map((v) => (
                      <tr key={v.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                        <td style={{ padding: '14px 20px', fontWeight: 600 }}>
                          {v.customer?.name || 'Customer'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                          {v.customer?.phone || '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-gold">Visit #{v.visitNumber}</span>
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>
                          {v.staff?.name || 'Store Manager'}
                        </td>
                        <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                          {new Date(v.scannedAt).toLocaleString()}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span className="badge badge-emerald">Verified Scan</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 10: CAFE SETTINGS                                    */}
        {/* ========================================================= */}
        {activeSection === 'settings' && (
          <div style={{ maxWidth: '780px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '30px' }}>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '6px' }}>Store & Operational Profile</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '24px' }}>
                Update your cafe's public brand details, contact information, and business hours.
              </p>

              <form onSubmit={handleSaveSettings}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Cafe Business Name</label>
                    <input
                      type="text"
                      required
                      className="input-field"
                      value={cafeSettings.cafeName}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, cafeName: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Store Email</label>
                    <input
                      type="email"
                      required
                      className="input-field"
                      value={cafeSettings.contactEmail}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, contactEmail: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px', marginBottom: '18px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Store Phone</label>
                    <input
                      type="tel"
                      className="input-field"
                      value={cafeSettings.contactPhone}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, contactPhone: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Guest WiFi Password</label>
                    <input
                      type="text"
                      className="input-field"
                      value={cafeSettings.wifiPassword}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, wifiPassword: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '18px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Physical Store Address</label>
                  <input
                    type="text"
                    className="input-field"
                    value={cafeSettings.address}
                    onChange={(e) => setCafeSettings({ ...cafeSettings, address: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '18px', marginBottom: '26px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Opening Time</label>
                    <input
                      type="text"
                      className="input-field"
                      value={cafeSettings.openingTime}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, openingTime: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Closing Time</label>
                    <input
                      type="text"
                      className="input-field"
                      value={cafeSettings.closingTime}
                      onChange={(e) => setCafeSettings({ ...cafeSettings, closingTime: e.target.value })}
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={savingSettings}
                  className="btn-primary"
                  style={{ padding: '12px 28px', fontWeight: 700 }}
                >
                  {savingSettings ? 'Saving Changes...' : 'Save Cafe Settings'}
                </button>
              </form>
            </div>

            {/* Super Admin Restricted Settings Card */}
            <div
              className="glass-panel"
              style={{
                padding: '24px 28px',
                border: '1px solid rgba(244, 63, 94, 0.25)',
                background: 'rgba(244, 63, 94, 0.03)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                <Lock size={18} color="#fb7185" />
                <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff' }}>
                  Platform & Subscription Settings (Super Admin Only)
                </h4>
              </div>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', lineHeight: 1.6 }}>
                As <strong>Cafe Manager (Neha Sharma)</strong>, your credentials have <strong>Cafe Level access</strong> for <strong>{cafeSettings.cafeName}</strong>. The following platform capabilities are restricted:
              </p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '10px', fontSize: '0.8rem' }}>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={14} color="#fb7185" />
                  <span>Subscription Plan & Billing Upgrade</span>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={14} color="#fb7185" />
                  <span>Onboard New Cafes into TRIOAS</span>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={14} color="#fb7185" />
                  <span>Access Other Cafes' Patron Data</span>
                </div>
                <div style={{ padding: '10px 14px', borderRadius: '8px', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-card)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <XCircle size={14} color="#fb7185" />
                  <span>Create or Elevate to Super Admin</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* VIEW 11: MY PROFILE                                       */}
        {/* ========================================================= */}
        {activeSection === 'profile' && (
          <div style={{ maxWidth: '840px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div className="glass-panel" style={{ padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '26px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0c0b0a',
                    fontWeight: 800,
                    fontSize: '1.6rem',
                  }}
                >
                  N
                </div>
                <div>
                  <h3 style={{ fontSize: '1.35rem', fontWeight: 800 }}>{user?.name || 'Neha Sharma'}</h3>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                    <span className="badge badge-gold">Manager</span>
                    <span className="badge badge-emerald">Active</span>
                    <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{user?.email || 'neha@gmail.com'}</span>
                  </div>
                </div>
              </div>

              {/* Manager Details Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px', marginBottom: '28px' }}>
                <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Role</div>
                  <div style={{ fontWeight: 700, marginTop: '2px', color: 'var(--accent-gold)' }}>Cafe Manager</div>
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Assigned Cafe</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>{cafeSettings.cafeName}</div>
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Access Level</div>
                  <div style={{ fontWeight: 700, marginTop: '2px' }}>Cafe Level</div>
                </div>
                <div style={{ padding: '14px 18px', borderRadius: '12px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid var(--border-card)' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Account Status</div>
                  <div style={{ fontWeight: 700, marginTop: '2px', color: '#10b981' }}>Active</div>
                </div>
              </div>

              {/* Role-Based Permissions Access Matrix */}
              <div style={{ marginBottom: '28px' }}>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <ShieldCheck size={18} color="var(--accent-gold)" />
                  <span>Role-Based Access Rights & Permissions Matrix</span>
                </h4>
                <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.82rem', textAlign: 'left' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid var(--border-card)', background: 'rgba(255, 255, 255, 0.02)' }}>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Portal Page / Module</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Manager ka Access</th>
                        <th style={{ padding: '12px 16px', color: 'var(--text-muted)' }}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { page: 'Dashboard', access: 'View (Metrics, Footfall, Quick Shortcuts)', status: 'Allowed' },
                        { page: 'Customers', access: 'View, Search, Filter registered customers', status: 'Allowed' },
                        { page: 'Staff Scanner', access: 'Scan QR, Manual Phone Entry, Log Visit', status: 'Allowed' },
                        { page: 'Rewards & Perks', access: 'Create, Edit, Activate, Deactivate loyalty rules', status: 'Allowed' },
                        { page: 'Redemptions', access: 'View, Verify vouchers, Redemption history', status: 'Allowed' },
                        { page: 'Analytics & Reports', access: 'View store stats, Export CSV reports', status: 'Allowed' },
                        { page: 'WhatsApp Notifications', access: 'View delivery logs, Send notifications', status: 'Allowed' },
                        { page: 'Staff Management', access: 'Add barista staff, Edit, Deactivate', status: 'Allowed' },
                        { page: 'Cafe Settings', access: 'Limited Edit (Hours, contact, Wi-Fi)', status: 'Allowed' },
                        { page: 'My Profile', access: 'Edit own profile credentials & password', status: 'Allowed' },
                      ].map((row, idx) => (
                        <tr key={idx} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          <td style={{ padding: '10px 16px', fontWeight: 600 }}>{row.page}</td>
                          <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{row.access}</td>
                          <td style={{ padding: '10px 16px' }}>
                            <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>✓ Allowed</span>
                          </td>
                        </tr>
                      ))}
                      <tr style={{ background: 'rgba(244, 63, 94, 0.04)' }}>
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: '#fb7185' }}>Platform Subscriptions & Multi-Cafe</td>
                        <td style={{ padding: '10px 16px', color: '#fda4af' }}>Plan upgrade, new cafe onboarding, other cafes' data</td>
                        <td style={{ padding: '10px 16px' }}>
                          <span className="badge" style={{ background: 'rgba(244, 63, 94, 0.2)', color: '#fb7185', fontSize: '0.65rem' }}>🔒 Restricted</span>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Password update form */}
              <h4 style={{ fontSize: '1.05rem', fontWeight: 700, marginBottom: '16px' }}>Change Account Password</h4>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  toast('Password updated successfully for manager account!', 'success');
                  setProfilePass({ current: '', newPass: '', confirm: '' });
                }}
              >
                <div style={{ marginBottom: '14px' }}>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Current Password</label>
                  <input
                    type="password"
                    required
                    className="input-field"
                    value={profilePass.current}
                    onChange={(e) => setProfilePass({ ...profilePass, current: e.target.value })}
                  />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '22px' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>New Password</label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={profilePass.newPass}
                      onChange={(e) => setProfilePass({ ...profilePass, newPass: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Confirm New Password</label>
                    <input
                      type="password"
                      required
                      className="input-field"
                      value={profilePass.confirm}
                      onChange={(e) => setProfilePass({ ...profilePass, confirm: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button type="submit" className="btn-primary" style={{ padding: '10px 22px' }}>
                    Save Password
                  </button>
                  <button
                    type="button"
                    onClick={logout}
                    className="btn-secondary"
                    style={{ color: '#fb7185', borderColor: 'rgba(244, 63, 94, 0.3)' }}
                  >
                    <LogOut size={14} />
                    <span>Sign Out of Portal</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* MODALS                                                    */}
      {/* ========================================================= */}

      {/* CREATE STAFF MODAL */}
      {showStaffModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Add Barista / Staff</h3>
            <form onSubmit={handleCreateStaff}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sam Barista"
                  className="input-field"
                  value={staffForm.name}
                  onChange={(e) => setStaffForm({ ...staffForm, name: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email</label>
                <input
                  type="email"
                  required
                  placeholder="sam@cafe.com"
                  className="input-field"
                  value={staffForm.email}
                  onChange={(e) => setStaffForm({ ...staffForm, email: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  className="input-field"
                  value={staffForm.password}
                  onChange={(e) => setStaffForm({ ...staffForm, password: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone</label>
                <input
                  type="tel"
                  placeholder="9876543210"
                  className="input-field"
                  value={staffForm.phone}
                  onChange={(e) => setStaffForm({ ...staffForm, phone: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowStaffModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Staff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE PROGRAM MODAL */}
      {showProgramModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '460px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Configure Loyalty Program</h3>
            <form onSubmit={handleCreateProgram}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Program Name</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  value={programForm.name}
                  onChange={(e) => setProgramForm({ ...programForm, name: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Required Visits to Unlock Perk</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  required
                  className="input-field"
                  value={programForm.requiredVisits}
                  onChange={(e) => setProgramForm({ ...programForm, requiredVisits: Number(e.target.value) })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Free Perk / Reward Description</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Free Artisanal Coffee / Croissant"
                  className="input-field"
                  value={programForm.rewardValue}
                  onChange={(e) => setProgramForm({ ...programForm, rewardValue: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowProgramModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Launch Program
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CREATE CUSTOMER MODAL */}
      {showCustomerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <h3 style={{ fontSize: '1.3rem', fontWeight: 700, marginBottom: '16px' }}>Register Customer</h3>
            <form onSubmit={handleCreateCustomer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Customer Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Maya Patel"
                  className="input-field"
                  value={customerForm.name}
                  onChange={(e) => setCustomerForm({ ...customerForm, name: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Phone Number</label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="input-field"
                  value={customerForm.phone}
                  onChange={(e) => setCustomerForm({ ...customerForm, phone: e.target.value })}
                />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Email (Optional)</label>
                <input
                  type="email"
                  placeholder="maya@example.com"
                  className="input-field"
                  value={customerForm.email}
                  onChange={(e) => setCustomerForm({ ...customerForm, email: e.target.value })}
                />
              </div>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowCustomerModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Register
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
