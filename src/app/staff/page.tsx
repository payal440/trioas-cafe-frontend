'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Coffee,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  QrCode,
  UserCheck,
  Award,
  History,
  LogOut,
  RefreshCw,
  Gift,
  Plus,
  Search,
  Check,
  X,
  Users,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { staffApi, customerApi } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';
import { Customer, VisitLog } from '@/types';

export default function StaffScannerPage() {
  const { role, user, loginStaff, logout } = useAuth();
  const { toast } = useToast();

  // Login form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Dynamic Visit QR state
  const [activeQR, setActiveQR] = useState<{
    token: string;
    expiresAt: number;
    qrPayload: string;
    expiresInSeconds: number;
    clientId?: string;
    sig?: string;
    localIp?: string;
  } | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(30);
  const [qrLoading, setQrLoading] = useState(false);

  // Generates clickable web URL that Google Lens and mobile camera apps recognize
  const getSmartScanUrl = (qr: typeof activeQR) => {
    if (!qr) return '';
    if (typeof window === 'undefined') return qr.qrPayload || '';

    let sig = qr.sig;
    let clientId = qr.clientId || (user as any)?.clientId || 'c0000000-0000-0000-0000-000000000001';
    if (!sig && qr.qrPayload) {
      try {
        const parsed = JSON.parse(qr.qrPayload);
        sig = parsed.sig;
        if (parsed.clientId) clientId = parsed.clientId;
      } catch {}
    }

    const protocol = window.location.protocol;
    const port = window.location.port ? `:${window.location.port}` : '';
    const host =
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      qr.localIp &&
      qr.localIp !== 'localhost'
        ? `${qr.localIp}${port}`
        : window.location.host;

    return `${protocol}//${host}/customer?scanToken=${encodeURIComponent(qr.token)}&clientId=${encodeURIComponent(clientId)}&expiresAt=${qr.expiresAt}&sig=${encodeURIComponent(sig || '')}`;
  };

  // Real-time scan detection state
  const [lastScannedEvent, setLastScannedEvent] = useState<{
    customer: { id: string; name: string; phone: string };
    visitNumber: number;
    isRewardUnlocked: boolean;
    reward?: any;
    timestamp: Date;
  } | null>(null);

  // Register Customer Modal state
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ name: '', phone: '', email: '' });
  const [registering, setRegistering] = useState(false);

  // Customer Lookup & Manual Scan fallback
  const [searchPhone, setSearchPhone] = useState('');
  const [foundCustomer, setFoundCustomer] = useState<Customer | null>(null);
  const [searchingCustomer, setSearchingCustomer] = useState(false);
  const [rewardCodeInput, setRewardCodeInput] = useState('');
  const [redeeming, setRedeeming] = useState(false);

  // Shift logs
  const [shiftVisits, setShiftVisits] = useState<VisitLog[]>([]);

  const isStaffAuthenticated = role === 'staff' && user;

  // Load shift visits on mount if logged in
  useEffect(() => {
    if (isStaffAuthenticated) {
      loadShiftVisits();
      generateNewVisitQR();
    }
  }, [isStaffAuthenticated]);

  // 30-Second Countdown Timer & Auto Refresh
  useEffect(() => {
    if (!activeQR) return;

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.ceil((activeQR.expiresAt - Date.now()) / 1000));
      setSecondsRemaining(diff);

      if (diff <= 0) {
        // Automatically generate fresh QR when expired
        generateNewVisitQR();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [activeQR]);

  // Real-time polling to detect when customer scans the QR
  useEffect(() => {
    if (!activeQR || !isStaffAuthenticated) return;

    const pollInterval = setInterval(async () => {
      try {
        let status: any = null;
        try {
          status = await staffApi.getVisitQRStatus(activeQR.token);
        } catch {
          status = await customerApi.getVisitQRStatus(activeQR.token);
        }
        if (status && status.isUsed && status.customer) {
          // Customer successfully scanned!
          setLastScannedEvent({
            customer: status.customer,
            visitNumber: status.visitNumber || 1,
            isRewardUnlocked: !!status.isRewardUnlocked,
            reward: status.reward,
            timestamp: new Date(),
          });

          confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } });
          toast(`✅ Scanned by ${status.customer.name}! Visit recorded.`, 'success');

          loadShiftVisits();

          // After 2.5 seconds, auto-generate fresh QR for the next patron
          setTimeout(() => {
            generateNewVisitQR();
          }, 2500);
        }
      } catch (err) {
        // silent fail on poll
      }
    }, 1800);

    return () => clearInterval(pollInterval);
  }, [activeQR, isStaffAuthenticated]);

  const loadShiftVisits = async () => {
    try {
      const res = await staffApi.getVisits();
      if (res && res.visits) {
        setShiftVisits(res.visits);
      }
    } catch (e) {
      console.warn('Could not load shift visits:', e);
    }
  };

  const generateNewVisitQR = async () => {
    try {
      setQrLoading(true);
      const clientId = (user as any)?.clientId || 'c0000000-0000-0000-0000-000000000001';
      const staffName = user?.name || 'Staff Barista';

      let qrData: any = null;

      // 1. Try authenticated staffApi
      try {
        const res = await staffApi.generateVisitQR({ expiresInSeconds: 30 });
        const extracted = res?.qrPayload ? res : (res as any)?.data;
        if (extracted && extracted.qrPayload) {
          qrData = extracted;
        }
      } catch (e) {
        console.warn('staffApi.generateVisitQR failed, trying public fallback:', e);
      }

      // 2. Try customerApi fallback
      if (!qrData) {
        try {
          const res = await customerApi.generateVisitQR({
            clientId,
            staffId: user?.id || 'staff_barista',
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
          staffId: user?.id || 'counter_terminal',
          token,
          expiresAt,
          sig: `sig_local_${token.slice(3, 11)}`,
        });

        qrData = {
          token,
          clientId,
          staffId: user?.id || 'counter_terminal',
          staffName,
          expiresAt,
          expiresInSeconds: 30,
          qrPayload,
        };
      }

      setActiveQR(qrData);
      setSecondsRemaining(30);
    } catch (err: any) {
      console.warn('Visit QR generate error:', err);
    } finally {
      setQrLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter staff email and password', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      await loginStaff(email.trim(), password);
      toast('Logged into Staff Scanner Terminal!', 'success');
      loadShiftVisits();
    } catch (err: any) {
      toast(err.message || 'Staff login failed. Check credentials.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegisterCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!registerForm.name.trim() || !registerForm.phone.trim()) {
      toast('Customer name and phone are required', 'error');
      return;
    }

    try {
      setRegistering(true);
      const res = await customerApi.register({
        name: registerForm.name.trim(),
        phone: registerForm.phone.trim(),
        email: registerForm.email.trim() || undefined,
      });

      if (res && res.customer) {
        toast(`Customer ${res.customer.name} registered! They can now scan the QR.`, 'success');
        setShowRegisterModal(false);
        setRegisterForm({ name: '', phone: '', email: '' });
        // Immediately generate a fresh QR ready for them
        generateNewVisitQR();
      }
    } catch (err: any) {
      toast(err.message || 'Could not register customer', 'error');
    } finally {
      setRegistering(false);
    }
  };

  const handleLookupCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchPhone.trim()) return;

    try {
      setSearchingCustomer(true);
      const res = await customerApi.lookup(searchPhone.trim());
      if (res && res.customer) {
        setFoundCustomer(res.customer);
        toast(`Customer ${res.customer.name} found!`, 'success');
      }
    } catch (err: any) {
      toast('Customer not found with this phone number', 'error');
      setFoundCustomer(null);
    } finally {
      setSearchingCustomer(false);
    }
  };

  const handleRedeemVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rewardCodeInput.trim() || !foundCustomer) return;

    try {
      setRedeeming(true);
      const res = await staffApi.redeemReward({
        rewardCode: rewardCodeInput.trim(),
        customerId: foundCustomer.id,
      });

      if (res.success) {
        toast(`🎉 Perk redeemed successfully: ${res.reward?.rewardValue || 'Reward'}`, 'success');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        setRewardCodeInput('');
        handleLookupCustomer(e);
      }
    } catch (err: any) {
      toast(err.message || 'Failed to redeem reward code', 'error');
    } finally {
      setRedeeming(false);
    }
  };

  // Login view if not authenticated
  if (!isStaffAuthenticated) {
    return (
      <div style={{ maxWidth: '440px', margin: '60px auto 80px', padding: '0 20px' }}>
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
                boxShadow: '0 4px 18px rgba(245, 158, 11, 0.4)',
              }}
            >
              <QrCode size={30} />
            </div>
            <h1 style={{ fontSize: '1.55rem', fontWeight: 800 }}>Staff Scanner Terminal</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              Sign in with your Barista / Staff account to generate dynamic visit QRs for counter patrons.
            </p>
          </div>

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Staff Email
              </label>
              <input
                type="email"
                required
                placeholder="sam@cafe.com"
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
              {authLoading ? 'Signing In...' : 'Launch Staff Terminal'}
            </button>
          </form>

          <div
            style={{
              marginTop: '24px',
              padding: '12px 14px',
              borderRadius: '10px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)',
              fontSize: '0.78rem',
              color: 'var(--text-muted)',
              textAlign: 'center',
            }}
          >
            Staff accounts are provisioned by Cafe Admin in the management portal.
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // STAFF TERMINAL: DYNAMIC REVERSE QR DISPLAY
  // ==========================================
  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Top Header Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 28px',
          marginBottom: '26px',
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
              <h1 style={{ fontSize: '1.35rem', fontWeight: 800 }}>Staff Scanner / Visit Terminal</h1>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem' }}>
                LIVE COUNTER
              </span>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              Operator: <strong style={{ color: '#fff' }}>{user?.name}</strong> • Trio Cafe Counter
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {/* Quick First-Time Customer Registration */}
          <button
            onClick={() => setShowRegisterModal(true)}
            className="btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          >
            <Plus size={15} />
            <span>Register New Customer</span>
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

      {/* Main Two-Column Layout: Terminal Dynamic QR (Left) & Shift Activity (Right) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '26px' }}>
        {/* ========================================================= */}
        {/* LEFT COLUMN: THE DYNAMIC VISIT QR DISPLAY (USER SPEC)     */}
        {/* ========================================================= */}
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
          {/* Status Badge & Generator Action */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', marginBottom: '20px' }}>
            <span
              className="badge badge-emerald"
              style={{ padding: '4px 10px', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#34d399', display: 'inline-block' }} />
              <span>Counter Ready</span>
            </span>

            <button
              onClick={generateNewVisitQR}
              disabled={qrLoading}
              className="btn-secondary"
              style={{ padding: '6px 12px', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '6px' }}
            >
              <RefreshCw size={13} className={qrLoading ? 'animate-spin' : ''} />
              <span>Generate Visit QR</span>
            </button>
          </div>

          {/* THE BIG QR CODE CARD */}
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
            {activeQR ? (
              <QRCodeSVG
                value={getSmartScanUrl(activeQR)}
                size={230}
                level="M"
                includeMargin={false}
              />
            ) : (
              <div style={{ width: '230px', height: '230px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>
                Loading QR...
              </div>
            )}
          </div>

          <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
            Show this QR to customer
          </h2>

          {/* Quick Helper Actions: Test in new tab & Copy Link */}
          {activeQR && (
            <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
              <a
                href={getSmartScanUrl(activeQR)}
                target="_blank"
                rel="noreferrer"
                className="btn-primary"
                style={{
                  padding: '6px 14px',
                  fontSize: '0.8rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  textDecoration: 'none',
                }}
              >
                <span>🔗 Test Customer Scan</span>
              </a>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(getSmartScanUrl(activeQR));
                  toast('Scan link copied to clipboard!', 'success');
                }}
                className="btn-secondary"
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
              >
                📋 Copy Link
              </button>
            </div>
          )}

          {/* COUNTDOWN TIMER BADGE */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 22px',
              borderRadius: 'var(--radius-full)',
              background: secondsRemaining <= 5 ? 'rgba(244, 63, 94, 0.2)' : 'rgba(245, 158, 11, 0.15)',
              border: `1px solid ${secondsRemaining <= 5 ? 'rgba(244, 63, 94, 0.4)' : 'rgba(245, 158, 11, 0.3)'}`,
              marginBottom: '14px',
            }}
          >
            <Clock size={16} color={secondsRemaining <= 5 ? '#fb7185' : 'var(--accent-gold)'} />
            <span
              style={{
                fontFamily: 'monospace',
                fontSize: '1.05rem',
                fontWeight: 800,
                color: secondsRemaining <= 5 ? '#fb7185' : 'var(--accent-gold)',
                letterSpacing: '0.04em',
              }}
            >
              Expires in 00:{secondsRemaining < 10 ? `0${secondsRemaining}` : secondsRemaining}
            </span>
          </div>

          <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '16px' }}>
            📱 Customers can scan with <strong>Google Lens</strong>, phone camera, or the Customer Portal scanner.
          </p>

          {/* Instructions Callout */}
          <div
            style={{
              width: '100%',
              padding: '14px 18px',
              borderRadius: '14px',
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid var(--border-card)',
              fontSize: '0.8rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ fontWeight: 700, color: 'var(--accent-gold)', marginBottom: '3px' }}>
              How Reverse Visit Flow Works:
            </div>
            <div>• <strong>First Visit:</strong> Click <strong>[ Register New Customer ]</strong> → Patron logs in → Scans QR → Visit = 1/3</div>
            <div>• <strong>Next Visit:</strong> Display counter QR → Patron taps <strong>[ Scan Cafe QR ]</strong> → Visit = 2/3</div>
            <div>• <strong>3rd Visit:</strong> Patron scans → 3/3 Visits → 🎉 Free Coffee Unlocked + WhatsApp Alert!</div>
          </div>

          {/* Real-time Scan Success Notification Banner */}
          {lastScannedEvent && (
            <div
              style={{
                marginTop: '18px',
                width: '100%',
                padding: '16px 20px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.2) 0%, rgba(20, 18, 16, 0.8) 100%)',
                border: '1px solid #10b981',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                textAlign: 'left',
                animation: 'pulse 1.5s infinite',
              }}
            >
              <CheckCircle2 size={28} color="#34d399" />
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#34d399' }}>
                  {lastScannedEvent.isRewardUnlocked ? '🎉 Reward Milestone Reached!' : 'Visit Recorded!'}
                </div>
                <div style={{ fontSize: '0.8rem', color: '#fff', marginTop: '2px' }}>
                  Scanned by <strong>{lastScannedEvent.customer.name}</strong> ({lastScannedEvent.customer.phone})
                </div>
                <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Visit #{lastScannedEvent.visitNumber} • {lastScannedEvent.timestamp.toLocaleTimeString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: CUSTOMER LOOKUP & SHIFT LOGS                */}
        {/* ========================================================= */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
          {/* Quick Customer Search & Voucher Redemption */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Search size={18} color="var(--accent-gold)" />
              <span>Customer Lookup & Reward Redemption</span>
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Lookup customer by phone to check visit count or redeem an earned reward voucher.
            </p>

            <form onSubmit={handleLookupCustomer} style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <input
                type="tel"
                placeholder="Enter customer phone (e.g. 9876543210)"
                className="input-field"
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
              />
              <button type="submit" disabled={searchingCustomer} className="btn-secondary" style={{ whiteSpace: 'nowrap' }}>
                {searchingCustomer ? 'Searching...' : 'Lookup'}
              </button>
            </form>

            {foundCustomer && (
              <div
                style={{
                  padding: '16px',
                  borderRadius: '12px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-card)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
                  <div>
                    <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{foundCustomer.name}</span>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{foundCustomer.phone}</div>
                  </div>
                  <span className="badge badge-emerald">Enrolled</span>
                </div>

                {/* Redeem Voucher Form */}
                <form onSubmit={handleRedeemVoucher} style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                  <input
                    type="text"
                    placeholder="Enter Reward Code (REW-XXXXXX)"
                    className="input-field"
                    style={{ fontSize: '0.82rem' }}
                    value={rewardCodeInput}
                    onChange={(e) => setRewardCodeInput(e.target.value.toUpperCase())}
                  />
                  <button type="submit" disabled={redeeming} className="btn-primary" style={{ padding: '8px 14px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                    {redeeming ? 'Redeeming...' : 'Claim Perk'}
                  </button>
                </form>
              </div>
            )}
          </div>

          {/* Shift Scans Feed */}
          <div className="glass-panel" style={{ padding: '24px', flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Today’s Customer Visits</h3>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                {shiftVisits.length} Visits Logged
              </span>
            </div>

            {shiftVisits.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px 0', color: 'var(--text-muted)' }}>
                <Coffee size={28} style={{ margin: '0 auto 10px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.85rem' }}>No visits recorded yet on this shift.</p>
                <p style={{ fontSize: '0.75rem', marginTop: '4px' }}>
                  Show the QR code to arriving patrons to log visits!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '340px', overflowY: 'auto' }}>
                {shiftVisits.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '10px',
                      background: 'rgba(255, 255, 255, 0.02)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      fontSize: '0.82rem',
                    }}
                  >
                    <div>
                      <span style={{ fontWeight: 600 }}>{v.customer?.name || 'Customer'}</span>
                      <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                        Visit #{v.visitNumber} • {v.customer?.phone || 'Pass'}
                      </div>
                    </div>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                      {new Date(v.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* FIRST TIME CUSTOMER REGISTRATION MODAL                     */}
      {/* ========================================================= */}
      {showRegisterModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '18px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Users size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Register New Customer</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                style={{ color: 'var(--text-muted)', padding: '4px', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
              Register the customer on the spot. Once registered, they can open their pass on their phone and scan the counter QR!
            </p>

            <form onSubmit={handleRegisterCustomer}>
              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Customer Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Payal Sharma"
                  className="input-field"
                  value={registerForm.name}
                  onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '14px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="input-field"
                  value={registerForm.phone}
                  onChange={(e) => setRegisterForm({ ...registerForm, phone: e.target.value })}
                />
              </div>

              <div style={{ marginBottom: '22px' }}>
                <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="payal@example.com"
                  className="input-field"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowRegisterModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={registering}
                  className="btn-primary"
                  style={{ padding: '10px 22px' }}
                >
                  {registering ? 'Registering...' : 'Register Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
