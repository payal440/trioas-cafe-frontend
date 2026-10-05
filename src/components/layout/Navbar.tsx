'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Coffee, QrCode, Shield, Store, LogOut, Sparkles, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const Navbar = () => {
  const pathname = usePathname();
  const { role, user, logout } = useAuth();

  const navLinks = [
    { href: '/customer', label: 'Customer Pass', icon: QrCode },
    { href: '/staff', label: 'Staff Scanner', icon: Coffee },
    { href: '/admin', label: 'Cafe Admin', icon: Store },
    { href: '/super-admin', label: 'Super Admin', icon: Shield },
  ];

  return (
    <header
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(12, 11, 10, 0.82)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--border-card)',
        padding: '0 24px',
      }}
    >
      <div
        style={{
          maxWidth: '1280px',
          margin: '0 auto',
          height: '70px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand Logo */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '40px',
              height: '40px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #c2410c 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 14px rgba(245, 158, 11, 0.35)',
            }}
          >
            <Coffee size={22} color="#0c0b0a" strokeWidth={2.4} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span
                style={{
                  fontFamily: 'var(--font-display)',
                  fontWeight: 800,
                  fontSize: '1.25rem',
                  letterSpacing: '0.04em',
                  color: '#fff',
                }}
              >
                TRIOAS
              </span>
              <span className="badge badge-gold" style={{ fontSize: '0.65rem', padding: '2px 6px' }}>
                CAFE OS
              </span>
            </div>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '-2px' }}>
              Smart Loyalty & Rewards
            </p>
          </div>
        </Link>

        {/* Portal Nav Links */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'rgba(28, 25, 23, 0.6)',
            padding: '4px',
            borderRadius: 'var(--radius-full)',
            border: '1px solid var(--border-card)',
          }}
        >
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: 'var(--radius-full)',
                  fontSize: '0.85rem',
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? '#0c0b0a' : 'var(--text-secondary)',
                  background: isActive ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  transition: 'all 0.2s ease',
                }}
              >
                <Icon size={15} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Session Info / Role */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {role ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                background: 'rgba(255, 255, 255, 0.04)',
                padding: '6px 12px 6px 14px',
                borderRadius: 'var(--radius-full)',
                border: '1px solid var(--border-subtle)',
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {user?.name || user?.phone || 'Active User'}
                </span>
                <span
                  style={{
                    fontSize: '0.68rem',
                    color: 'var(--accent-gold)',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                >
                  {role === 'client_admin' ? 'CAFE MANAGER' : role.replace('_', ' ')}
                </span>
              </div>
              <button
                onClick={logout}
                title="Logout session"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  background: 'rgba(244, 63, 94, 0.15)',
                  color: '#fb7185',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(244, 63, 94, 0.3)',
                  transition: 'all 0.2s',
                }}
              >
                <LogOut size={14} />
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="btn-secondary"
              style={{ padding: '8px 18px', fontSize: '0.85rem' }}
            >
              <UserCheck size={15} />
              <span>Portal Login</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};
