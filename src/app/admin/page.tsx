'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';
import { clientAdminApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Staff, LoyaltyProgram, Customer, VisitLog } from '@/types';

export default function CafeAdminDashboard() {
  const { role, user, loginClientAdmin, logout } = useAuth();
  const { toast } = useToast();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Active Tab: 'overview' | 'staff' | 'programs' | 'customers'
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'programs' | 'customers'>('overview');
  const [loading, setLoading] = useState(false);

  // Dashboard Data
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [staffList, setStaffList] = useState<Staff[]>([]);
  const [programsList, setProgramsList] = useState<LoyaltyProgram[]>([]);
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [visitsList, setVisitsList] = useState<VisitLog[]>([]);

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

  const isAuthenticated = role === 'client_admin' && user;

  useEffect(() => {
    if (isAuthenticated) {
      loadAllData();
    }
  }, [isAuthenticated, activeTab]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'overview') {
        const data = await clientAdminApi.dashboard();
        setDashboardData(data);
      } else if (activeTab === 'staff') {
        const res = await clientAdminApi.listStaff();
        setStaffList(res.staff || []);
      } else if (activeTab === 'programs') {
        const res = await clientAdminApi.listLoyaltyPrograms();
        setProgramsList(res.programs || []);
      } else if (activeTab === 'customers') {
        const [cRes, vRes] = await Promise.all([
          clientAdminApi.listCustomers(),
          clientAdminApi.listVisits(),
        ]);
        setCustomersList(cRes.customers || []);
        setVisitsList(vRes.visits || []);
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
      toast('Welcome to your Cafe Owner Portal!', 'success');
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

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await clientAdminApi.createCustomer(customerForm);
      toast(`Customer ${customerForm.name} registered!`, 'success');
      setShowCustomerModal(false);
      setCustomerForm({ name: '', phone: '', email: '' });
      const cRes = await clientAdminApi.listCustomers();
      setCustomersList(cRes.customers || []);
    } catch (err: any) {
      toast(err.message || 'Could not add customer', 'error');
    }
  };

  // Login View
  if (!isAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto 80px', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(59, 130, 246, 0.15)',
                border: '1px solid rgba(59, 130, 246, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#60a5fa',
                marginBottom: '16px',
              }}
            >
              <Store size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Cafe Manager Login</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              Sign in to manage your cafe's loyalty rules, staff roster, and view retention metrics.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Admin Email
              </label>
              <input
                type="email"
                required
                placeholder="owner@cafe.com"
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
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {authLoading ? 'Authenticating...' : 'Sign In to Dashboard'}
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
              Created during cafe onboarding in the <code>/super-admin</code> console.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Cafe Admin Dashboard
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Top Header */}
      <div
        className="glass-panel"
        style={{
          padding: '24px 28px',
          marginBottom: '28px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '14px',
              background: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
            }}
          >
            <Store size={26} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 800 }}>Cafe Management Portal</h1>
              <span className="badge badge-indigo">Cafe Admin</span>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              Manager: <strong style={{ color: '#fff' }}>{user?.name}</strong> ({user?.email})
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            onClick={loadAllData}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem' }}
          >
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
          <button
            onClick={logout}
            className="btn-secondary"
            style={{ padding: '8px 14px', fontSize: '0.85rem', color: '#fb7185' }}
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div
        style={{
          display: 'flex',
          gap: '8px',
          marginBottom: '24px',
          borderBottom: '1px solid var(--border-card)',
          paddingBottom: '12px',
          overflowX: 'auto',
        }}
      >
        {[
          { id: 'overview', label: 'Overview & Metrics', icon: TrendingUp },
          { id: 'staff', label: 'Staff Management', icon: Users },
          { id: 'programs', label: 'Loyalty Programs', icon: Award },
          { id: 'customers', label: 'Customers & Visits', icon: Coffee },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.9rem',
                fontWeight: isActive ? 700 : 500,
                color: isActive ? '#fff' : 'var(--text-secondary)',
                background: isActive ? 'rgba(255, 255, 255, 0.08)' : 'transparent',
                border: isActive ? '1px solid var(--border-subtle)' : '1px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} color={isActive ? 'var(--accent-gold)' : 'currentColor'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* KPI Cards Grid */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: '20px',
            }}
          >
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Registered Customers</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#fff' }}>
                {dashboardData?.stats?.totalCustomers ?? 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Visits Today</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: 'var(--accent-gold)' }}>
                {dashboardData?.stats?.visitsToday ?? 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Total Visits Recorded</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#34d399' }}>
                {dashboardData?.stats?.totalVisits ?? 0}
              </div>
            </div>
            <div className="glass-panel" style={{ padding: '24px' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Barista Staff</span>
              <div style={{ fontSize: '2rem', fontWeight: 800, marginTop: '8px', color: '#818cf8' }}>
                {dashboardData?.stats?.totalStaff ?? 0}
              </div>
            </div>
          </div>

          {/* Recent Visits Feed */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={20} color="var(--accent-gold)" />
              <span>Recent Customer Visits</span>
            </h3>

            {dashboardData?.recentVisits?.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                No customer visits logged yet. Use the Staff Scanner to record the first visit!
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {dashboardData?.recentVisits?.map((v: VisitLog) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '14px 18px',
                      borderRadius: '12px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 700 }}>{v.customer?.name || 'Customer'}</span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                        Visit #{v.visitNumber} • Barista: {v.staff?.name || 'Staff'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {new Date(v.scannedAt).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: STAFF MANAGEMENT */}
      {activeTab === 'staff' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Cafe Barista & Staff Roster</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Create accounts for baristas and cashiers to scan customer QR codes.
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
              <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                <Users size={36} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p>No staff accounts found.</p>
                <button
                  onClick={() => setShowStaffModal(true)}
                  className="btn-secondary"
                  style={{ marginTop: '12px' }}
                >
                  Create First Staff Member
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
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem' }}>{s.name}</span>
                        <span className={`badge ${s.isActive ? 'badge-emerald' : 'badge-gold'}`}>
                          {s.isActive ? 'Active' : 'Disabled'}
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
                        style={{ padding: '6px 14px', fontSize: '0.8rem' }}
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

      {/* TAB 3: LOYALTY PROGRAMS */}
      {activeTab === 'programs' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Loyalty Programs & Stamp Rules</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                Define visit milestones and reward perks for your customers.
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
                    {prog.isActive ? 'Active Program' : 'Inactive'}
                  </span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {prog.requiredVisits} Visits Milestone
                  </span>
                </div>

                <h4 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>{prog.name}</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '18px' }}>
                  {prog.description || 'No description provided.'}
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
                    <span style={{ color: 'var(--text-muted)' }}>Reward: </span>
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

      {/* TAB 4: CUSTOMERS & VISITS */}
      {activeTab === 'customers' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Customer Directory</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                All registered patrons and their loyalty status.
              </p>
            </div>
            <button
              onClick={() => setShowCustomerModal(true)}
              className="btn-primary"
              style={{ padding: '10px 18px', fontSize: '0.9rem' }}
            >
              <Plus size={16} />
              <span>Register Customer</span>
            </button>
          </div>

          <div className="glass-panel" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '0.88rem' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-card)', color: 'var(--text-muted)' }}>
                  <th style={{ padding: '16px 20px' }}>Name</th>
                  <th style={{ padding: '16px 20px' }}>Phone</th>
                  <th style={{ padding: '16px 20px' }}>Email</th>
                  <th style={{ padding: '16px 20px' }}>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {customersList.map((c) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.04)' }}>
                    <td style={{ padding: '14px 20px', fontWeight: 600 }}>{c.name}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-secondary)' }}>{c.phone}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>{c.email || '—'}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)' }}>
                      {new Date(c.registeredAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  placeholder="e.g. Free Cappuccino or Cinnamon Roll"
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
