'use client';

import React from 'react';
import Link from 'next/link';
import {
  Coffee,
  QrCode,
  Store,
  Shield,
  Sparkles,
  ArrowRight,
  CheckCircle,
  Zap,
  Users,
  Award,
  Smartphone,
  BarChart3,
} from 'lucide-react';

export default function HomePage() {
  const portals = [
    {
      title: 'Customer Digital Pass',
      badge: 'Zero App Download',
      desc: 'Customers register or lookup via phone to unlock their live digital loyalty card, track coffee stamps, and claim free rewards.',
      href: '/customer',
      icon: QrCode,
      color: '#f59e0b',
      features: ['Phone-based lookup & sign-up', 'Interactive digital stamp card', 'Dynamic QR loyalty pass', 'Instant reward unlock'],
    },
    {
      title: 'Barista Scanner Terminal',
      badge: 'Staff Point-of-Sale',
      desc: 'Mobile-ready camera scanner for baristas and cashiers to scan customer passes, stamp visits with 1 tap, and redeem perks.',
      href: '/staff',
      icon: Smartphone,
      color: '#10b981',
      features: ['Live camera QR scanner', 'Instant customer validation', '1-tap visit check-in', 'Real-time shift visit log'],
    },
    {
      title: 'Cafe Owner Portal',
      badge: 'Client Admin',
      desc: 'Comprehensive management dashboard for cafe managers to track daily footfall, configure loyalty rules, and manage staff.',
      href: '/admin',
      icon: Store,
      color: '#3b82f6',
      features: ['Analytics & footfall KPI cards', 'Staff team management', 'Custom loyalty program rules', 'Customer visit audit trail'],
    },
    {
      title: 'Super Admin Console',
      badge: 'SaaS Platform Engine',
      desc: 'Central command for TRIOAS platform operators to onboard new cafe branches, monitor subscriptions, and view WhatsApp logs.',
      href: '/super-admin',
      icon: Shield,
      color: '#8b5cf6',
      features: ['Multi-tenant cafe onboarding', 'Plan & quota limits', 'Cafe admin provisioning', 'WhatsApp broadcast logs'],
    },
  ];

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Hero Section */}
      <section style={{ textAlign: 'center', padding: '40px 0 60px', position: 'relative' }}>
        <div
          className="badge badge-gold"
          style={{
            marginBottom: '20px',
            fontSize: '0.8rem',
            padding: '6px 16px',
            letterSpacing: '0.08em',
          }}
        >
          <Sparkles size={14} />
          <span>TRIOAS CAFE LOYALTY PLATFORM</span>
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: 'clamp(2.4rem, 5vw, 4rem)',
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: '-0.02em',
            maxWidth: '900px',
            margin: '0 auto 20px',
            background: 'linear-gradient(180deg, #FFFFFF 0%, #E2D9D0 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Turn Every Coffee Sip Into <br />
          <span
            style={{
              background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Lasting Customer Loyalty
          </span>
        </h1>

        <p
          style={{
            fontSize: 'clamp(1rem, 1.8vw, 1.25rem)',
            color: 'var(--text-secondary)',
            maxWidth: '680px',
            margin: '0 auto 36px',
            lineHeight: 1.6,
          }}
        >
          The complete multi-tenant digital loyalty platform. Seamless QR passes for customers,
          lightning-fast camera scanner for baristas, and real-time retention tools for cafe owners.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
          <Link href="/customer" className="btn-primary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            <QrCode size={18} />
            <span>Open Customer Pass</span>
            <ArrowRight size={16} />
          </Link>
          <Link href="/staff" className="btn-secondary" style={{ padding: '14px 28px', fontSize: '1rem' }}>
            <Coffee size={18} />
            <span>Launch Staff Scanner</span>
          </Link>
          <Link href="/login" className="btn-secondary" style={{ padding: '14px 24px', fontSize: '1rem' }}>
            <span>Portal Login Hub</span>
          </Link>
        </div>
      </section>

      {/* 4 Portals Grid */}
      <section style={{ marginTop: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.8rem', fontWeight: 700 }}>
              Four Integrated Portals
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
              Built specifically to sync with your Express & Prisma backend architecture
            </p>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '24px',
          }}
        >
          {portals.map((portal) => {
            const Icon = portal.icon;
            return (
              <div
                key={portal.title}
                className="glass-panel"
                style={{
                  padding: '30px',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Glow accent */}
                <div
                  style={{
                    position: 'absolute',
                    top: '-40px',
                    right: '-40px',
                    width: '120px',
                    height: '120px',
                    borderRadius: '50%',
                    background: portal.color,
                    opacity: 0.12,
                    filter: 'blur(30px)',
                    pointerEvents: 'none',
                  }}
                />

                <div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <div
                      style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '14px',
                        background: `rgba(${portal.color === '#f59e0b' ? '245, 158, 11' : portal.color === '#10b981' ? '16, 185, 129' : portal.color === '#3b82f6' ? '59, 130, 246' : '139, 92, 246'}, 0.15)`,
                        border: `1px solid ${portal.color}40`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: portal.color,
                      }}
                    >
                      <Icon size={24} />
                    </div>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        padding: '4px 10px',
                        borderRadius: 'var(--radius-full)',
                        background: 'rgba(255, 255, 255, 0.05)',
                        border: '1px solid var(--border-card)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {portal.badge}
                    </span>
                  </div>

                  <h3 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '10px' }}>
                    {portal.title}
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.5, marginBottom: '20px' }}>
                    {portal.desc}
                  </p>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '24px' }}>
                    {portal.features.map((feat) => (
                      <div key={feat} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                        <CheckCircle size={14} color={portal.color} />
                        <span>{feat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <Link
                  href={portal.href}
                  className="btn-secondary"
                  style={{
                    width: '100%',
                    justifyContent: 'space-between',
                    padding: '12px 18px',
                  }}
                >
                  <span>Launch Portal</span>
                  <ArrowRight size={16} />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      {/* Backend Tech Harmony Section */}
      <section
        className="glass-panel"
        style={{
          marginTop: '60px',
          padding: '36px',
          background: 'linear-gradient(135deg, rgba(28, 25, 23, 0.9) 0%, rgba(18, 16, 14, 0.95) 100%)',
          border: '1px solid var(--border-subtle)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <Zap size={20} color="var(--accent-gold)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.3rem', fontWeight: 700 }}>
            Powered By Connected Architecture
          </h3>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '24px', maxWidth: '750px' }}>
          Configured to interface with your Express backend running on <code>http://localhost:5000</code>.
          Supports MariaDB database schemas, JWT token validation, camera-based QR tokens, and BullMQ queues.
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '16px',
          }}
        >
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Backend Engine</span>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>Express 5 + Node.js</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Database & ORM</span>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>MySQL / MariaDB + Prisma</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Security</span>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>JWT Multi-Role Auth</div>
          </div>
          <div style={{ padding: '16px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-card)' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Frontend Framework</span>
            <div style={{ fontWeight: 700, marginTop: '4px' }}>Next.js 15 (App Router)</div>
          </div>
        </div>
      </section>
    </div>
  );
}
