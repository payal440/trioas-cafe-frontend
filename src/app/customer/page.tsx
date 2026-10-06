'use client';

import React, { useState, useEffect, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import {
  Coffee,
  Sparkles,
  Gift,
  CheckCircle2,
  Phone,
  User,
  ArrowRight,
  RefreshCw,
  Award,
  Clock,
  Camera,
  QrCode,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  ChevronRight,
} from 'lucide-react';
import { customerApi } from '@/lib/api';
import { Customer, CustomerReward } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';

export default function CustomerPortal() {
  const { toast } = useToast();
  const { setCustomerSession, user: authUser } = useAuth();

  // Auth & Profile states
  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [rewards, setRewards] = useState<CustomerReward[]>([]);

  // Reverse QR Camera Scanner states
  const [showScannerModal, setShowScannerModal] = useState(false);
  const [scannerLoading, setScannerLoading] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [pendingScanPayload, setPendingScanPayload] = useState<string | null>(null);
  const [scanSuccessInfo, setScanSuccessInfo] = useState<{
    visitNumber: number;
    totalVisits: number;
    requiredVisits: number;
    isRewardUnlocked: boolean;
    unlockedReward?: CustomerReward;
    message: string;
  } | null>(null);

  const scannerRef = useRef<any>(null);

  // Check if customer session exists in AuthContext
  useEffect(() => {
    if (authUser && 'qrToken' in authUser) {
      setCustomer(authUser as Customer);
      loadCustomerDetails((authUser as Customer).phone);
    }
  }, [authUser]);

  // Read URL query parameters on mount (Google Lens / Mobile Camera scan handling)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const scanToken = searchParams.get('scanToken') || searchParams.get('token');

      if (scanToken) {
        const fullUrl = window.location.href;
        setPendingScanPayload(fullUrl);

        // Check if customer is already stored in localStorage
        let storedCust: Customer | null = null;
        try {
          const raw = localStorage.getItem('trioas_customer_session');
          if (raw) storedCust = JSON.parse(raw);
        } catch {}

        if (storedCust && storedCust.id) {
          setCustomer(storedCust);
          loadCustomerDetails(storedCust.phone);
          toast('🎉 Visit QR detected! Recording your visit...', 'info');
          handleProcessVisit(fullUrl, storedCust.id);
          window.history.replaceState({}, '', window.location.pathname);
        } else {
          toast('🎉 Cafe Visit QR Scanned! Enter your phone number to collect your stamp.', 'info');
        }
      }
    } catch (e) {
      console.warn('URL scan param parse error:', e);
    }
  }, []);

  const loadCustomerDetails = async (phoneNumber: string) => {
    try {
      setLoading(true);
      const res = await customerApi.lookup(phoneNumber);
      if (res && res.customer) {
        setCustomer(res.customer);
        setLoyalty(res.loyalty || null);
        setRewards(res.rewards || []);
        setCustomerSession(res.customer);

        // If eligible for reward, trigger confetti!
        if (res.loyalty?.isEligibleForReward && !res.loyalty?.rewardClaimed) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      }
    } catch (err: any) {
      console.warn('Customer lookup error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      toast('Please enter a valid phone number (minimum 8 digits)', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await customerApi.lookup(phone.trim());
      if (res && res.customer) {
        setCustomer(res.customer);
        setLoyalty(res.loyalty || null);
        setRewards(res.rewards || []);
        setCustomerSession(res.customer);
        toast(`Welcome back, ${res.customer.name}!`, 'success');

        if (res.loyalty?.isEligibleForReward && !res.loyalty?.rewardClaimed) {
          confetti({ particleCount: 100, spread: 80, origin: { y: 0.6 } });
        }

        // If user came via Google Lens / QR URL scan, auto-process pending scan!
        if (pendingScanPayload) {
          const payloadToProcess = pendingScanPayload;
          setPendingScanPayload(null);
          window.history.replaceState({}, '', window.location.pathname);
          toast('Recording your scanned visit stamp...', 'info');
          setTimeout(() => {
            handleProcessVisit(payloadToProcess, res.customer.id);
          }, 350);
        }
      } else {
        setIsRegistering(true);
        toast('Phone not found. Please complete quick registration below!', 'info');
      }
    } catch (err: any) {
      setIsRegistering(true);
      toast('Phone not registered yet. Fill in your name to get your digital pass!', 'info');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || phone.trim().length < 8) {
      toast('Please enter a valid phone number (minimum 8 digits)', 'error');
      return;
    }

    const finalName = name.trim() || `Patron ${phone.trim().slice(-4)}`;

    try {
      setLoading(true);
      const res = await customerApi.register({
        name: finalName,
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      if (res && res.customer) {
        setCustomer(res.customer);
        setCustomerSession(res.customer);
        toast('🎉 Welcome to TRIOAS Rewards! Your digital pass is ready.', 'success');
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
        await loadCustomerDetails(res.customer.phone);

        // If user came via Google Lens / QR URL scan, auto-process pending scan!
        if (pendingScanPayload) {
          const payloadToProcess = pendingScanPayload;
          setPendingScanPayload(null);
          window.history.replaceState({}, '', window.location.pathname);
          toast('Recording your 1st visit stamp...', 'info');
          setTimeout(() => {
            handleProcessVisit(payloadToProcess, res.customer.id);
          }, 350);
        }
      }
    } catch (err: any) {
      toast(err.message || 'Registration failed. Try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleResetSession = () => {
    setCustomer(null);
    setLoyalty(null);
    setRewards([]);
    setPhone('');
    setName('');
    setIsRegistering(false);
    setScanSuccessInfo(null);
    localStorage.removeItem('trioas_customer_session');
    localStorage.removeItem('trioas_active_role');
  };

  // ==========================================
  // REVERSE QR: Camera Scanner Handling
  // ==========================================
  const startCustomerScanner = async () => {
    setShowScannerModal(true);
    setScanSuccessInfo(null);

    try {
      const { Html5Qrcode } = await import('html5-qrcode');

      setTimeout(() => {
        try {
          const html5QrCode = new Html5Qrcode('customer-camera-reader');
          scannerRef.current = html5QrCode;

          html5QrCode
            .start(
              { facingMode: 'environment' },
              { fps: 12, qrbox: { width: 260, height: 260 } },
              async (decodedText) => {
                toast('QR Code detected! Verifying visit...', 'info');
                await stopCustomerScanner();
                await handleProcessVisit(decodedText);
              },
              () => {}
            )
            .catch((err) => {
              console.warn('Camera access error:', err);
              toast('Camera permission required. You can also paste the code manually.', 'info');
            });
        } catch (e) {
          console.warn('Scanner init error:', e);
        }
      }, 350);
    } catch (err) {
      toast('Could not start camera scanner', 'error');
    }
  };

  const stopCustomerScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.warn('Stop scanner error:', e);
      }
      scannerRef.current = null;
    }
    setShowScannerModal(false);
  };

  const handleProcessVisit = async (qrPayloadString: string, targetCustomerId?: string) => {
    const custId = targetCustomerId || customer?.id;
    if (!custId) {
      toast('Please enter your phone number first to record your visit!', 'info');
      return;
    }

    try {
      setScannerLoading(true);
      const res = await customerApi.scanVisit({
        customerId: custId,
        qrPayload: qrPayloadString,
      });

      if (res.success) {
        confetti({ particleCount: 140, spread: 90, origin: { y: 0.6 } });
        toast(res.message || '🎉 Visit recorded successfully!', 'success');
        setScanSuccessInfo({
          visitNumber: res.visitNumber,
          totalVisits: res.totalVisits,
          requiredVisits: res.requiredVisits,
          isRewardUnlocked: res.isRewardUnlocked,
          unlockedReward: res.unlockedReward,
          message: res.message,
        });

        // Reload customer details to update stamp progress & rewards list
        const phoneToReload = customer?.phone || phone;
        if (phoneToReload) {
          await loadCustomerDetails(phoneToReload);
        }
      }
    } catch (err: any) {
      toast(err.message || 'Failed to record visit. QR code may be expired.', 'error');
    } finally {
      setScannerLoading(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;
    await stopCustomerScanner();
    await handleProcessVisit(manualCodeInput.trim());
    setManualCodeInput('');
  };

  const requiredVisits = loyalty?.program?.requiredVisits || 3;
  const currentVisits = loyalty?.totalVisits || 0;
  const currentMilestoneProgress = currentVisits % requiredVisits;
  const visitsLeft = isNaN(requiredVisits - currentMilestoneProgress)
    ? 3
    : currentMilestoneProgress === 0 && currentVisits > 0
    ? 0
    : requiredVisits - currentMilestoneProgress;
  const isRewardUnlocked = loyalty?.isEligibleForReward || (currentVisits > 0 && currentVisits % requiredVisits === 0);
  const cafeName = loyalty?.client?.name || 'Trio Cafe';

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '28px' }}>
        <div className="badge badge-gold" style={{ marginBottom: '10px' }}>
          <Sparkles size={13} />
          <span>TRIOAS SMART LOYALTY PASS</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.3rem', fontWeight: 800 }}>
          {customer ? `Welcome, ${customer.name} 👋` : 'Cafe Loyalty Pass'}
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem' }}>
          {customer
            ? `${cafeName} • Scan counter QR to collect stamps and unlock rewards`
            : 'Enter your phone number to access your stamp card or register as a new customer'}
        </p>
      </div>

      {!customer ? (
        /* Phone Lookup & Quick Registration Form */
        <div
          className="glass-panel"
          style={{
            maxWidth: '460px',
            margin: '0 auto',
            padding: '36px',
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(245, 158, 11, 0.15)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'var(--accent-gold)',
                marginBottom: '16px',
              }}
            >
              <Coffee size={28} />
            </div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
              {isRegistering ? 'Join Trio Cafe Rewards' : 'Access Your Pass'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              {isRegistering
                ? 'Register once to start earning free artisanal coffee & perks'
                : 'Enter your phone number to view stamps and scan visit QR'}
            </p>
          </div>

          {/* Pending Scan Notice for Google Lens / Camera users */}
          {pendingScanPayload && (
            <div
              style={{
                padding: '16px 18px',
                borderRadius: '16px',
                background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(20, 18, 16, 0.8) 100%)',
                border: '1.5px solid rgba(245, 158, 11, 0.5)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                marginBottom: '20px',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.25)',
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '12px',
                  background: '#f59e0b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0c0b0a',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <div style={{ fontWeight: 800, fontSize: '0.92rem', color: '#f59e0b' }}>
                  Counter Visit QR Scanned! ☕
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  Enter your mobile number below to instantly record your visit stamp!
                </p>
              </div>
            </div>
          )}

          <form onSubmit={isRegistering ? handleRegister : handleLookup}>
            {isRegistering && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Your Name (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                  <input
                    type="text"
                    placeholder="e.g. Payal (or leave empty)"
                    className="input-field"
                    style={{ paddingLeft: '40px' }}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Phone Number
              </label>
              <div style={{ position: 'relative' }}>
                <Phone
                  size={16}
                  color="var(--text-muted)"
                  style={{ position: 'absolute', left: '14px', top: '15px' }}
                />
                <input
                  type="tel"
                  required
                  placeholder="e.g. 9876543210"
                  className="input-field"
                  style={{ paddingLeft: '40px' }}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {isRegistering && (
              <div style={{ marginBottom: '20px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Email (Optional)
                </label>
                <input
                  type="email"
                  placeholder="payal@example.com"
                  className="input-field"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn-primary"
              style={{ width: '100%', padding: '14px', fontSize: '1rem', fontWeight: 700 }}
            >
              {loading ? (
                <span>Checking...</span>
              ) : isRegistering ? (
                <>
                  <span>Create Loyalty Pass</span>
                  <ArrowRight size={16} />
                </>
              ) : (
                <>
                  <span>Access My Pass</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '20px', textAlign: 'center' }}>
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              style={{ fontSize: '0.85rem', color: 'var(--accent-gold)', fontWeight: 600 }}
            >
              {isRegistering ? '← Already registered? Look up phone' : 'New customer? Click here to register'}
            </button>
          </div>
        </div>
      ) : (
        /* Active Customer Pass & Interactive Reverse QR Section */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '26px' }}>
          {/* Last Scan Celebration Banner */}
          {scanSuccessInfo && (
            <div
              className="glass-panel"
              style={{
                padding: '18px 24px',
                border: '1px solid rgba(16, 185, 129, 0.4)',
                background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(20, 18, 16, 0.6) 100%)',
                borderRadius: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#34d399',
                  }}
                >
                  <CheckCircle2 size={24} />
                </div>
                <div>
                  <div style={{ fontWeight: 800, fontSize: '1rem', color: '#34d399' }}>
                    {scanSuccessInfo.isRewardUnlocked ? '🎉 Reward Milestone Reached!' : 'Visit Recorded Successfully!'}
                  </div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {scanSuccessInfo.message}
                  </div>
                </div>
              </div>

              {scanSuccessInfo.isRewardUnlocked && scanSuccessInfo.unlockedReward && (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <code style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--accent-gold)', background: 'rgba(245, 158, 11, 0.15)', padding: '6px 12px', borderRadius: '8px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>
                    {scanSuccessInfo.unlockedReward.rewardCode}
                  </code>
                </div>
              )}
            </div>
          )}

          {/* Main Digital Loyalty Card */}
          <div
            className="glow-card"
            style={{
              padding: '34px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(145deg, #1f1b17 0%, #12100e 100%)',
              border: '1px solid rgba(245, 158, 11, 0.3)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-glow)',
            }}
          >
            {/* Top Bar of Card */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
                paddingBottom: '20px',
                marginBottom: '26px',
                flexWrap: 'wrap',
                gap: '12px',
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
                  <Coffee size={24} strokeWidth={2.4} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#fff' }}>Welcome, {customer.name} 👋</h2>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '2px' }}>
                    <span className="badge badge-gold" style={{ fontSize: '0.68rem', padding: '1px 8px' }}>
                      {cafeName}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{customer.phone}</span>
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => loadCustomerDetails(customer.phone)}
                  disabled={loading}
                  title="Refresh card"
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                  <span>Refresh</span>
                </button>
                <button
                  onClick={handleResetSession}
                  style={{
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                    textDecoration: 'underline',
                    padding: '8px',
                  }}
                >
                  Change Account
                </button>
              </div>
            </div>

            {/* Split: Stamp Progress & Action Center */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              {/* Left: Stamp Progress Display */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Your Visits
                    </span>
                    <h3 style={{ fontSize: '1.4rem', fontWeight: 800, marginTop: '2px' }}>
                      {currentMilestoneProgress === 0 && currentVisits > 0 && isRewardUnlocked
                        ? `${requiredVisits} / ${requiredVisits} Visits`
                        : `${currentMilestoneProgress} / ${requiredVisits} Visits`}
                    </h3>
                  </div>
                  <span
                    className={`badge ${isRewardUnlocked ? 'badge-emerald' : 'badge-gold'}`}
                    style={{ fontSize: '0.78rem', padding: '6px 14px' }}
                  >
                    {isRewardUnlocked ? '🎉 REWARD UNLOCKED!' : `${visitsLeft} visits to next perk`}
                  </span>
                </div>

                {/* Visual Stamp Slots: ● ● ○ */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${requiredVisits}, 1fr)`,
                    gap: '12px',
                    marginBottom: '20px',
                  }}
                >
                  {Array.from({ length: requiredVisits }).map((_, idx) => {
                    const isStamped =
                      (currentMilestoneProgress > idx) ||
                      (currentVisits > 0 && currentMilestoneProgress === 0 && isRewardUnlocked);
                    const isLast = idx === requiredVisits - 1;

                    return (
                      <div
                        key={idx}
                        style={{
                          aspectRatio: '1',
                          borderRadius: '16px',
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          background: isStamped
                            ? 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)'
                            : 'rgba(255, 255, 255, 0.04)',
                          border: isStamped
                            ? '2px solid #f59e0b'
                            : '2px dashed rgba(255, 255, 255, 0.15)',
                          color: isStamped ? '#0c0b0a' : 'var(--text-muted)',
                          boxShadow: isStamped ? '0 6px 18px rgba(245, 158, 11, 0.45)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          position: 'relative',
                        }}
                      >
                        {isLast ? (
                          <Gift size={24} color={isStamped ? '#0c0b0a' : 'var(--accent-gold)'} />
                        ) : (
                          <Coffee size={24} strokeWidth={isStamped ? 2.5 : 1.8} />
                        )}
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            marginTop: '4px',
                            color: isStamped ? '#0c0b0a' : 'var(--text-muted)',
                          }}
                        >
                          Visit #{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Next Reward Callout */}
                <div
                  style={{
                    padding: '14px 18px',
                    borderRadius: '14px',
                    background: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid var(--border-card)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                  }}
                >
                  <Award size={22} color="var(--accent-gold)" />
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 700, color: '#fff' }}>
                      Next Reward: ☕ {loyalty?.program?.rewardValue || 'Free Coffee or Item'}
                    </span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem', marginTop: '2px' }}>
                      Complete {requiredVisits} visits to claim a complimentary drink on the house!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Reverse QR Action - SCAN CAFE QR */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.03)',
                  padding: '28px 24px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-card)',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.2) 0%, rgba(217, 119, 6, 0.1) 100%)',
                    border: '1px solid rgba(245, 158, 11, 0.3)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--accent-gold)',
                    marginBottom: '16px',
                  }}
                >
                  <Camera size={30} />
                </div>

                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#fff', marginBottom: '6px' }}>
                  Record Cafe Visit
                </h3>
                <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '22px', maxWidth: '260px' }}>
                  Tap below to open your camera and scan the dynamic Visit QR displayed on the staff terminal!
                </p>

                {/* THE CORE BUTTON REQUESTED BY USER */}
                <button
                  type="button"
                  onClick={startCustomerScanner}
                  disabled={scannerLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '14px 20px',
                    fontSize: '1.02rem',
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '10px',
                    boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
                  }}
                >
                  <Camera size={20} />
                  <span>[ Scan Cafe QR ]</span>
                </button>

                <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '12px' }}>
                  ⏱️ Counter QRs expire every 30s for tamper-proof security
                </p>
              </div>
            </div>
          </div>

          {/* Available Offers & Earned Rewards Section */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Gift size={22} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Available Offers & Rewards</h3>
              </div>
              <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                {rewards.filter((r) => !r.isRedeemed).length} Active Vouchers
              </span>
            </div>

            {rewards.length === 0 && !isRewardUnlocked ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem' }}>No rewards unlocked yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Scan the cafe QR {visitsLeft} more time{visitsLeft > 1 ? 's' : ''} to unlock your first reward!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isRewardUnlocked && (
                  <div
                    style={{
                      padding: '18px 22px',
                      borderRadius: '14px',
                      background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(20, 18, 16, 0.6) 100%)',
                      border: '1px solid rgba(16, 185, 129, 0.35)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <CheckCircle2 size={18} color="#34d399" />
                        <span style={{ fontWeight: 800, color: '#34d399' }}>
                          🎉 FREE REWARD UNLOCKED: {loyalty?.program?.rewardValue || 'Artisanal Coffee'}
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Tell the barista your phone number or show this pass to redeem your complimentary perk!
                      </p>
                    </div>
                    <span className="badge badge-emerald" style={{ padding: '6px 14px', fontWeight: 700 }}>
                      Ready to Claim
                    </span>
                  </div>
                )}

                {rewards.map((rew) => (
                  <div
                    key={rew.id}
                    style={{
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'rgba(255, 255, 255, 0.03)',
                      border: '1px solid var(--border-card)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '12px',
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontWeight: 700, fontSize: '0.98rem' }}>
                          {rew.rewardValue || 'Complimentary Item'}
                        </span>
                        <span className={`badge ${rew.isRedeemed ? 'badge-indigo' : 'badge-emerald'}`}>
                          {rew.isRedeemed ? 'Redeemed' : 'Active Voucher'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                        <code style={{ fontSize: '0.82rem', color: 'var(--accent-gold)', background: 'rgba(245, 158, 11, 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
                          CODE: {rew.rewardCode}
                        </code>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • Issued {new Date(rew.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {rew.isRedeemed ? 'Claimed at checkout' : 'Show code to Barista'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* CAMERA SCANNER MODAL (Point at Staff Screen QR)            */}
      {/* ========================================================= */}
      {showScannerModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '460px',
              padding: '28px',
              border: '1px solid var(--border-glow)',
              position: 'relative',
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Camera size={20} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Scan Counter QR</h3>
              </div>
              <button
                type="button"
                onClick={stopCustomerScanner}
                style={{
                  color: 'var(--text-muted)',
                  padding: '6px',
                  borderRadius: '8px',
                  background: 'rgba(255, 255, 255, 0.05)',
                  cursor: 'pointer',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
              Point camera at the <strong>Visit QR</strong> on the barista’s terminal or screen.
            </p>

            {/* Html5Qrcode Reader Container */}
            <div
              id="customer-camera-reader"
              style={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000',
                minHeight: '260px',
                border: '2px solid rgba(245, 158, 11, 0.4)',
              }}
            />

            {/* Manual Code Fallback */}
            <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-card)', paddingTop: '16px' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block', marginBottom: '8px', textAlign: 'center' }}>
                Camera not working? Enter QR payload / token manually:
              </span>
              <form onSubmit={handleManualCodeSubmit} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste or enter Visit QR data..."
                  className="input-field"
                  style={{ fontSize: '0.82rem' }}
                  value={manualCodeInput}
                  onChange={(e) => setManualCodeInput(e.target.value)}
                />
                <button type="submit" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                  Verify
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
      {/* ========================================================= */}
      {/* SCAN SUCCESS CELEBRATION MODAL                             */}
      {/* ========================================================= */}
      {scanSuccessInfo && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(12px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 120,
            padding: '20px',
          }}
        >
          <div
            className="glass-panel"
            style={{
              width: '100%',
              maxWidth: '440px',
              padding: '36px 28px',
              textAlign: 'center',
              border: scanSuccessInfo.isRewardUnlocked
                ? '2px solid rgba(16, 185, 129, 0.6)'
                : '2px solid rgba(245, 158, 11, 0.6)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.85)',
              borderRadius: '24px',
              background: 'linear-gradient(145deg, #1b1814 0%, #11100e 100%)',
              position: 'relative',
            }}
          >
            {/* Top Close icon */}
            <button
              onClick={() => setScanSuccessInfo(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                color: 'var(--text-muted)',
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
              }}
            >
              <X size={16} />
            </button>

            {/* Glowing Icon */}
            <div
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                background: scanSuccessInfo.isRewardUnlocked
                  ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                  : 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                boxShadow: scanSuccessInfo.isRewardUnlocked
                  ? '0 8px 30px rgba(16, 185, 129, 0.5)'
                  : '0 8px 30px rgba(245, 158, 11, 0.5)',
                marginBottom: '20px',
              }}
            >
              {scanSuccessInfo.isRewardUnlocked ? (
                <Gift size={38} strokeWidth={2.4} />
              ) : (
                <CheckCircle2 size={38} strokeWidth={2.4} />
              )}
            </div>

            <h2 style={{ fontSize: '1.6rem', fontWeight: 900, color: '#fff', marginBottom: '8px' }}>
              {scanSuccessInfo.isRewardUnlocked ? '🎉 REWARD UNLOCKED!' : '🎉 VISIT RECORDED!'}
            </h2>

            <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '22px' }}>
              {scanSuccessInfo.message || 'Your visit stamp has been credited!'}
            </p>

            {/* STAMP BADGE SUMMARY */}
            <div
              style={{
                padding: '18px',
                borderRadius: '16px',
                background: 'rgba(255, 255, 255, 0.04)',
                border: '1px solid var(--border-card)',
                marginBottom: '24px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center' }}>
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Your Stamps
                  </span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--accent-gold)', marginTop: '2px' }}>
                    {scanSuccessInfo.visitNumber % (scanSuccessInfo.requiredVisits || 3) === 0 && scanSuccessInfo.visitNumber > 0
                      ? `${scanSuccessInfo.requiredVisits || 3} / ${scanSuccessInfo.requiredVisits || 3}`
                      : `${scanSuccessInfo.visitNumber % (scanSuccessInfo.requiredVisits || 3)} / ${scanSuccessInfo.requiredVisits || 3}`}
                  </div>
                </div>
                <div style={{ width: '1px', height: '40px', background: 'rgba(255, 255, 255, 0.12)' }} />
                <div>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Reward Status
                  </span>
                  <div
                    style={{
                      fontSize: '0.95rem',
                      fontWeight: 800,
                      color: scanSuccessInfo.isRewardUnlocked ? '#34d399' : '#f59e0b',
                      marginTop: '4px',
                    }}
                  >
                    {scanSuccessInfo.isRewardUnlocked
                      ? 'Free Coffee Ready! ☕'
                      : `${(scanSuccessInfo.requiredVisits || 3) - (scanSuccessInfo.visitNumber % (scanSuccessInfo.requiredVisits || 3))} visits left`}
                  </div>
                </div>
              </div>

              {scanSuccessInfo.unlockedReward && (
                <div
                  style={{
                    marginTop: '16px',
                    padding: '12px',
                    borderRadius: '12px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px dashed #10b981',
                  }}
                >
                  <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 700, display: 'block' }}>
                    YOUR VOUCHER CODE
                  </span>
                  <code style={{ fontSize: '1.2rem', fontWeight: 900, color: '#34d399', letterSpacing: '0.1em' }}>
                    {scanSuccessInfo.unlockedReward.rewardCode}
                  </code>
                </div>
              )}
            </div>

            <button
              onClick={() => setScanSuccessInfo(null)}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '14px 20px',
                fontSize: '1rem',
                fontWeight: 800,
                boxShadow: '0 8px 25px rgba(245, 158, 11, 0.35)',
              }}
            >
              Continue to My Pass
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
