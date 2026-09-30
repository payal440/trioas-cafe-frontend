'use client';

import React, { useState, useEffect } from 'react';
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
  Share2,
} from 'lucide-react';
import { customerApi } from '@/lib/api';
import { Customer, CustomerReward } from '@/types';
import { useToast } from '@/components/ui/Toast';
import { useAuth } from '@/context/AuthContext';

export default function CustomerPortal() {
  const { toast } = useToast();
  const { setCustomerSession, user: authUser } = useAuth();

  const [phone, setPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loyalty, setLoyalty] = useState<any>(null);
  const [rewards, setRewards] = useState<CustomerReward[]>([]);

  // Check if customer session exists in AuthContext
  useEffect(() => {
    if (authUser && 'qrToken' in authUser) {
      setCustomer(authUser as Customer);
      loadCustomerDetails((authUser as Customer).phone);
    }
  }, [authUser]);

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
    if (!name.trim() || !phone.trim()) {
      toast('Name and phone number are required', 'error');
      return;
    }

    try {
      setLoading(true);
      const res = await customerApi.register({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
      });

      if (res && res.customer) {
        setCustomer(res.customer);
        setCustomerSession(res.customer);
        toast('🎉 Welcome to TRIOAS Rewards! Your digital pass is ready.', 'success');
        confetti({ particleCount: 90, spread: 60, origin: { y: 0.6 } });
        // Refresh details
        await loadCustomerDetails(res.customer.phone);
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
    localStorage.removeItem('trioas_customer_session');
    localStorage.removeItem('trioas_active_role');
  };

  const requiredVisits = loyalty?.program?.requiredVisits || 5;
  const currentVisits = loyalty?.totalVisits || 0;
  const visitsLeft = Math.max(0, requiredVisits - (currentVisits % requiredVisits));
  const isRewardUnlocked = loyalty?.isEligibleForReward || currentVisits >= requiredVisits;

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', padding: '30px 20px 80px' }}>
      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="badge badge-gold" style={{ marginBottom: '12px' }}>
          <Sparkles size={13} />
          <span>TRIOAS LOYALTY PASS</span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '2.4rem', fontWeight: 800 }}>
          Your Digital Coffee Pass
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Show this QR code to the barista during checkout to collect stamps and claim free rewards!
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
              {isRegistering ? 'Join Cafe Rewards' : 'Access Your Pass'}
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
              {isRegistering
                ? 'Register once to start earning free drinks & snacks'
                : 'Enter your phone number to view stamps and QR code'}
            </p>
          </div>

          <form onSubmit={isRegistering ? handleRegister : handleLookup}>
            {isRegistering && (
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                  Full Name
                </label>
                <div style={{ position: 'relative' }}>
                  <User
                    size={16}
                    color="var(--text-muted)"
                    style={{ position: 'absolute', left: '14px', top: '15px' }}
                  />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Sharma"
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
                  placeholder="alex@example.com"
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
              style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
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
                  <span>Find My Pass</span>
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
              {isRegistering ? '← Already have a pass? Look up phone' : 'New customer? Click here to register'}
            </button>
          </div>
        </div>
      ) : (
        /* Active Customer Pass & Interactive Stamp Card */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Main Digital Loyalty Card */}
          <div
            className="glow-card"
            style={{
              padding: '36px',
              borderRadius: 'var(--radius-xl)',
              background: 'linear-gradient(145deg, #1f1b17 0%, #12100e 100%)',
              border: '1px solid rgba(245, 158, 11, 0.25)',
              position: 'relative',
              overflow: 'hidden',
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
                marginBottom: '28px',
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
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#fff' }}>{customer.name}</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{customer.phone}</p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <button
                  onClick={() => loadCustomerDetails(customer.phone)}
                  title="Refresh card"
                  className="btn-secondary"
                  style={{ padding: '8px 12px', fontSize: '0.8rem' }}
                >
                  <RefreshCw size={14} />
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

            {/* Split: Interactive Stamp Card (Left) & QR Code (Right) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
                gap: '32px',
                alignItems: 'center',
              }}
            >
              {/* Left: Stamp Progress */}
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--accent-gold)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Loyalty Card Progress
                    </span>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginTop: '2px' }}>
                      {currentVisits} Total Visits
                    </h3>
                  </div>
                  <span
                    className={`badge ${isRewardUnlocked ? 'badge-emerald' : 'badge-gold'}`}
                    style={{ fontSize: '0.8rem', padding: '6px 14px' }}
                  >
                    {isRewardUnlocked ? '🎉 REWARD UNLOCKED!' : `${visitsLeft} visits to next perk`}
                  </span>
                </div>

                {/* Visual Stamp Slots */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(5, 1fr)',
                    gap: '10px',
                    marginBottom: '20px',
                  }}
                >
                  {Array.from({ length: requiredVisits }).map((_, idx) => {
                    const isStamped = (currentVisits % requiredVisits) > idx || (currentVisits > 0 && currentVisits % requiredVisits === 0 && isRewardUnlocked);
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
                            ? '1px solid #f59e0b'
                            : '1px dashed rgba(255, 255, 255, 0.15)',
                          color: isStamped ? '#0c0b0a' : 'var(--text-muted)',
                          boxShadow: isStamped ? '0 4px 14px rgba(245, 158, 11, 0.4)' : 'none',
                          transition: 'all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                          position: 'relative',
                        }}
                      >
                        {isLast ? (
                          <Gift size={20} color={isStamped ? '#0c0b0a' : 'var(--accent-gold)'} />
                        ) : (
                          <Coffee size={20} strokeWidth={isStamped ? 2.5 : 1.8} />
                        )}
                        <span
                          style={{
                            fontSize: '0.65rem',
                            fontWeight: 700,
                            marginTop: '4px',
                            color: isStamped ? '#0c0b0a' : 'var(--text-muted)',
                          }}
                        >
                          #{idx + 1}
                        </span>
                      </div>
                    );
                  })}
                </div>

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
                  <Award size={20} color="var(--accent-gold)" />
                  <div style={{ fontSize: '0.85rem' }}>
                    <span style={{ fontWeight: 600, color: '#fff' }}>
                      Program Reward: {loyalty?.program?.name || 'Free Artisan Beverage'}
                    </span>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.78rem' }}>
                      Collect {requiredVisits} stamps to receive a complimentary drink or bakery item!
                    </p>
                  </div>
                </div>
              </div>

              {/* Right: Personal QR Code Pass */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  background: 'rgba(255, 255, 255, 0.04)',
                  padding: '24px',
                  borderRadius: '20px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <span
                  style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--text-secondary)',
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                    marginBottom: '14px',
                  }}
                >
                  Scan At Checkout
                </span>

                <div
                  style={{
                    padding: '16px',
                    background: '#ffffff',
                    borderRadius: '16px',
                    boxShadow: '0 8px 30px rgba(0, 0, 0, 0.6)',
                  }}
                >
                  <QRCodeSVG
                    value={customer.qrToken}
                    size={170}
                    level="H"
                    includeMargin={false}
                  />
                </div>

                <div style={{ marginTop: '16px', textAlign: 'center' }}>
                  <code
                    style={{
                      fontSize: '0.75rem',
                      color: 'var(--accent-gold)',
                      background: 'rgba(245, 158, 11, 0.1)',
                      padding: '4px 10px',
                      borderRadius: '6px',
                      border: '1px solid rgba(245, 158, 11, 0.25)',
                    }}
                  >
                    TOKEN: {customer.qrToken.substring(0, 16)}...
                  </code>
                </div>
              </div>
            </div>
          </div>

          {/* Unlocked & Claimed Rewards Section */}
          <div className="glass-panel" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <Gift size={22} color="var(--accent-gold)" />
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>Your Earned Perks & Rewards</h3>
            </div>

            {rewards.length === 0 && !isRewardUnlocked ? (
              <div style={{ textAlign: 'center', padding: '30px 10px', color: 'var(--text-muted)' }}>
                <Clock size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.9rem' }}>No rewards claimed yet.</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  Complete {visitsLeft} more visit{visitsLeft > 1 ? 's' : ''} to unlock your first free reward!
                </p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {isRewardUnlocked && (
                  <div
                    style={{
                      padding: '16px 20px',
                      borderRadius: '14px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      border: '1px solid rgba(16, 185, 129, 0.3)',
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
                        <span style={{ fontWeight: 700, color: '#34d399' }}>
                          🎉 FREE REWARD READY FOR REDEMPTION!
                        </span>
                      </div>
                      <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        Tell the barista you have an unlocked reward ready to claim.
                      </p>
                    </div>
                    <span className="badge badge-emerald" style={{ padding: '6px 14px' }}>
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
                      <span style={{ fontWeight: 600 }}>{rew.rewardValue || 'Complimentary Item'}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                        <code style={{ fontSize: '0.78rem', color: 'var(--accent-gold)' }}>
                          CODE: {rew.rewardCode}
                        </code>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                          • {new Date(rew.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <span
                      className={`badge ${rew.isRedeemed ? 'badge-indigo' : 'badge-emerald'}`}
                    >
                      {rew.isRedeemed ? 'Redeemed' : 'Active'}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
