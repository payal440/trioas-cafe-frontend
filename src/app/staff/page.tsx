'use client';

import React, { useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import {
  Camera,
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
  ArrowRight,
} from 'lucide-react';
import { staffApi } from '@/lib/api';
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

  // Scanner & Validation states
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [manualToken, setManualToken] = useState('');
  const [scanning, setScanning] = useState(false);

  // Scanned Customer Details
  const [scannedCustomer, setScannedCustomer] = useState<Customer | null>(null);
  const [customerLoyalty, setCustomerLoyalty] = useState<any>(null);
  const [rewardEligible, setRewardEligible] = useState<boolean>(false);
  const [activeProgram, setActiveProgram] = useState<any>(null);

  // Redemption state
  const [rewardCodeInput, setRewardCodeInput] = useState('');

  // Shift logs
  const [shiftVisits, setShiftVisits] = useState<VisitLog[]>([]);
  const [actionLoading, setActionLoading] = useState(false);

  const scannerRef = useRef<any>(null);

  const isStaffAuthenticated = role === 'staff' && user;

  // Load shift visits on mount if logged in
  useEffect(() => {
    if (isStaffAuthenticated) {
      loadShiftVisits();
    }
  }, [isStaffAuthenticated]);

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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter your staff email and password', 'error');
      return;
    }

    try {
      setAuthLoading(true);
      await loginStaff(email.trim(), password);
      toast('Logged in to Staff Terminal successfully!', 'success');
      loadShiftVisits();
    } catch (err: any) {
      toast(err.message || 'Staff login failed. Check credentials.', 'error');
    } finally {
      setAuthLoading(false);
    }
  };

  // Start Camera QR Scanner
  const startCameraScanner = async () => {
    try {
      const { Html5Qrcode } = await import('html5-qrcode');
      setIsCameraActive(true);

      setTimeout(() => {
        const html5QrCode = new Html5Qrcode('qr-reader');
        scannerRef.current = html5QrCode;

        html5QrCode.start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText) => {
            // Found QR token!
            toast('QR Code detected!', 'info');
            stopCameraScanner();
            validateScannedToken(decodedText);
          },
          (errorMessage) => {
            // ignore scan frame errors
          }
        ).catch((err) => {
          console.error('Camera start error:', err);
          toast('Unable to access camera. You can paste the QR token manually.', 'error');
          setIsCameraActive(false);
        });
      }, 300);
    } catch (err) {
      toast('Error initializing QR camera scanner', 'error');
      setIsCameraActive(false);
    }
  };

  const stopCameraScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.stop().then(() => {
        scannerRef.current.clear();
        scannerRef.current = null;
        setIsCameraActive(false);
      }).catch((e: any) => {
        console.warn('Camera stop error:', e);
        setIsCameraActive(false);
      });
    } else {
      setIsCameraActive(false);
    }
  };

  const validateScannedToken = async (token: string) => {
    if (!token || !token.trim()) {
      toast('Please enter or scan a QR token', 'error');
      return;
    }

    try {
      setScanning(true);
      const res = await staffApi.validateQR(token.trim());
      if (res && res.customer) {
        setScannedCustomer(res.customer);
        setCustomerLoyalty(res.loyalty || null);
        setRewardEligible(!!res.rewardEligible);
        setActiveProgram(res.activeProgram || null);
        toast(`Validated pass for ${res.customer.name}!`, 'success');

        if (res.rewardEligible) {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        }
      } else {
        toast('Invalid or expired QR token', 'error');
      }
    } catch (err: any) {
      toast(err.message || 'Token validation failed', 'error');
    } finally {
      setScanning(false);
    }
  };

  const handleRecordVisit = async () => {
    if (!scannedCustomer) return;

    try {
      setActionLoading(true);
      const res = await staffApi.recordVisit({
        customerId: scannedCustomer.id,
      });

      if (res && res.success) {
        toast(`✅ Visit recorded! (${scannedCustomer.name})`, 'success');
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.5 } });

        if (res.rewardUnlocked) {
          toast('🎉 REWARD UNLOCKED! Customer reached milestone!', 'success');
          setRewardEligible(true);
        }

        // Refresh shift history
        loadShiftVisits();

        // Update local loyalty state
        if (res.loyalty) {
          setCustomerLoyalty(res.loyalty);
        }
      }
    } catch (err: any) {
      toast(err.message || 'Failed to record visit', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRedeemReward = async () => {
    if (!scannedCustomer || !rewardCodeInput.trim()) {
      toast('Please enter the reward redemption code', 'error');
      return;
    }

    try {
      setActionLoading(true);
      const res = await staffApi.redeemReward({
        customerId: scannedCustomer.id,
        rewardCode: rewardCodeInput.trim(),
      });

      if (res && res.success) {
        toast('🎉 Reward redeemed successfully!', 'success');
        confetti({ particleCount: 100, spread: 80, origin: { y: 0.5 } });
        setRewardCodeInput('');
        setRewardEligible(false);
        loadShiftVisits();
      }
    } catch (err: any) {
      toast(err.message || 'Redemption failed. Check code.', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearCurrentScan = () => {
    setScannedCustomer(null);
    setCustomerLoyalty(null);
    setRewardEligible(false);
    setActiveProgram(null);
    setManualToken('');
  };

  // Staff Login View
  if (!isStaffAuthenticated) {
    return (
      <div style={{ maxWidth: '480px', margin: '40px auto 80px', padding: '0 20px' }}>
        <div className="glass-panel" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
          <div style={{ textAlign: 'center', marginBottom: '28px' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '16px',
                background: 'rgba(16, 185, 129, 0.15)',
                border: '1px solid rgba(16, 185, 129, 0.3)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#34d399',
                marginBottom: '16px',
              }}
            >
              <Coffee size={28} />
            </div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Barista Terminal Login</h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              Sign in with your cafe staff account to scan customer loyalty cards.
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
                placeholder="barista@cafe.com"
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
              className="btn-success"
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
            >
              {authLoading ? 'Signing in...' : 'Open Terminal'}
            </button>
          </form>

          {/* Quick Demo Credentials Fill */}
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
            <span style={{ color: 'var(--text-muted)' }}>Cafe Staff Credentials</span>
            <div style={{ color: 'var(--text-secondary)', marginTop: '4px' }}>
              Use the staff account created in your <code>/admin</code> dashboard.
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Authenticated Staff Scanner Terminal
  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Top Status Header */}
      <div
        className="glass-panel"
        style={{
          padding: '20px 24px',
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
              width: '44px',
              height: '44px',
              borderRadius: '12px',
              background: 'rgba(16, 185, 129, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#34d399',
            }}
          >
            <Coffee size={22} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: 800 }}>Barista Terminal</h2>
              <span className="badge badge-emerald" style={{ fontSize: '0.65rem' }}>
                LIVE SHIFT
              </span>
            </div>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Logged in as: <strong style={{ color: '#fff' }}>{user?.name}</strong> ({user?.email})
            </p>
          </div>
        </div>

        <button
          onClick={logout}
          className="btn-secondary"
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
        >
          <LogOut size={14} />
          <span>End Shift</span>
        </button>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: '24px',
        }}
      >
        {/* Left Column: QR Camera Scanner & Input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={18} color="var(--accent-gold)" />
              <span>Camera QR Scanner</span>
            </h3>

            {/* Camera View Box */}
            <div
              style={{
                width: '100%',
                borderRadius: '16px',
                overflow: 'hidden',
                background: '#000',
                border: '1px solid var(--border-subtle)',
                minHeight: '260px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
              }}
            >
              <div id="qr-reader" style={{ width: '100%' }} />

              {!isCameraActive && (
                <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                  <QrCode size={48} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '16px' }}>
                    Point mobile camera or webcam at customer's QR pass
                  </p>
                  <button onClick={startCameraScanner} className="btn-primary">
                    <Camera size={16} />
                    <span>Start Camera</span>
                  </button>
                </div>
              )}

              {isCameraActive && (
                <button
                  onClick={stopCameraScanner}
                  className="btn-secondary"
                  style={{
                    position: 'absolute',
                    bottom: '12px',
                    zIndex: 10,
                    fontSize: '0.8rem',
                    padding: '6px 14px',
                  }}
                >
                  Stop Camera
                </button>
              )}
            </div>

            {/* Manual QR Token Fallback */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '6px' }}>
                Or Enter QR Token Manually
              </label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  placeholder="Paste customer QR token..."
                  className="input-field"
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') validateScannedToken(manualToken);
                  }}
                />
                <button
                  onClick={() => validateScannedToken(manualToken)}
                  disabled={scanning || !manualToken.trim()}
                  className="btn-secondary"
                  style={{ padding: '0 16px', flexShrink: 0 }}
                >
                  {scanning ? '...' : 'Validate'}
                </button>
              </div>
            </div>
          </div>

          {/* Shift Scan History */}
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <History size={18} color="var(--accent-gold)" />
                <h3 style={{ fontSize: '1.05rem', fontWeight: 700 }}>Today's Shift Scans</h3>
              </div>
              <button
                onClick={loadShiftVisits}
                style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.8rem' }}
              >
                <RefreshCw size={12} />
                <span>Refresh</span>
              </button>
            </div>

            {shiftVisits.length === 0 ? (
              <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px 0' }}>
                No visits stamped yet in this shift.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '240px', overflowY: 'auto' }}>
                {shiftVisits.map((v) => (
                  <div
                    key={v.id}
                    style={{
                      padding: '10px 14px',
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
                      <span style={{ fontWeight: 600, color: '#fff' }}>
                        {v.customer?.name || 'Customer'}
                      </span>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.72rem' }}>
                        Visit #{v.visitNumber} • {new Date(v.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>
                    <span className="badge badge-emerald" style={{ fontSize: '0.7rem' }}>
                      Stamped
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Customer Details & 1-Click Stamp Action */}
        <div>
          {scannedCustomer ? (
            <div
              className="glow-card"
              style={{
                padding: '30px',
                borderRadius: 'var(--radius-xl)',
                background: 'linear-gradient(145deg, #1e1b17 0%, #12100e 100%)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <span className="badge badge-gold">Active Customer Pass</span>
                <button
                  onClick={handleClearCurrentScan}
                  style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textDecoration: 'underline' }}
                >
                  Clear Scan
                </button>
              </div>

              {/* Customer Profile Preview */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '20px',
                    background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#0c0b0a',
                    fontWeight: 800,
                    fontSize: '1.5rem',
                    marginBottom: '12px',
                  }}
                >
                  {scannedCustomer.name.charAt(0).toUpperCase()}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800 }}>{scannedCustomer.name}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{scannedCustomer.phone}</p>
              </div>

              {/* Loyalty Progress Bar */}
              <div
                style={{
                  padding: '16px',
                  borderRadius: '14px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-card)',
                  marginBottom: '24px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Current Progress</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)' }}>
                    {customerLoyalty?.totalVisits || 0} Visits Recorded
                  </span>
                </div>
                <div
                  style={{
                    height: '8px',
                    borderRadius: '4px',
                    background: 'rgba(255, 255, 255, 0.1)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      borderRadius: '4px',
                      background: 'linear-gradient(90deg, #f59e0b, #10b981)',
                      width: `${Math.min(100, (((customerLoyalty?.totalVisits || 0) % 5) / 5) * 100)}%`,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
              </div>

              {/* Stamp Visit Action */}
              <div style={{ marginBottom: '24px' }}>
                <button
                  onClick={handleRecordVisit}
                  disabled={actionLoading}
                  className="btn-primary"
                  style={{
                    width: '100%',
                    padding: '16px',
                    fontSize: '1.05rem',
                    borderRadius: 'var(--radius-lg)',
                    boxShadow: '0 6px 25px rgba(245, 158, 11, 0.4)',
                  }}
                >
                  <Coffee size={20} />
                  <span>{actionLoading ? 'Stamping...' : 'STAMP VISIT (+1 Check-in)'}</span>
                </button>
              </div>

              {/* Reward Redemption Block */}
              {rewardEligible ? (
                <div
                  style={{
                    padding: '20px',
                    borderRadius: '16px',
                    background: 'rgba(16, 185, 129, 0.12)',
                    border: '1px solid rgba(16, 185, 129, 0.35)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Gift size={20} color="#34d399" />
                    <span style={{ fontWeight: 800, color: '#34d399', fontSize: '0.95rem' }}>
                      CUSTOMER HAS AN UNLOCKED REWARD!
                    </span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    Enter the redemption code provided on customer's phone to redeem.
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input
                      type="text"
                      placeholder="e.g. REW-1234"
                      className="input-field"
                      value={rewardCodeInput}
                      onChange={(e) => setRewardCodeInput(e.target.value)}
                    />
                    <button
                      onClick={handleRedeemReward}
                      disabled={actionLoading || !rewardCodeInput.trim()}
                      className="btn-success"
                      style={{ padding: '0 18px', flexShrink: 0 }}
                    >
                      Redeem
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    textAlign: 'center',
                    padding: '12px',
                    color: 'var(--text-muted)',
                    fontSize: '0.8rem',
                  }}
                >
                  <Sparkles size={14} style={{ display: 'inline', marginRight: '4px' }} />
                  Next milestone reward unlocks automatically upon completing program visits!
                </div>
              )}
            </div>
          ) : (
            <div
              className="glass-panel"
              style={{
                height: '100%',
                minHeight: '360px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '40px 20px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '20px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-muted)',
                  marginBottom: '16px',
                }}
              >
                <QrCode size={32} />
              </div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, marginBottom: '6px' }}>
                Waiting for Customer QR Scan
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', maxWidth: '320px' }}>
                Scan a customer's loyalty QR pass using the camera on the left, or paste their token to stamp their visit.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
