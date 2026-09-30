'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Coffee, Store, Shield, QrCode, ArrowRight, UserCheck } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/components/ui/Toast';

export default function UnifiedLoginPage() {
  const router = useRouter();
  const { loginClientAdmin, loginStaff, loginSuperAdmin } = useAuth();
  const { toast } = useToast();

  const [selectedRole, setSelectedRole] = useState<'client_admin' | 'staff' | 'super_admin'>('client_admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRoleSelect = (roleKey: 'client_admin' | 'staff' | 'super_admin') => {
    setSelectedRole(roleKey);
    if (roleKey === 'super_admin') {
      setEmail('admin@trioas.com');
      setPassword('Admin@123456');
    } else {
      setEmail('');
      setPassword('');
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast('Please enter email and password', 'error');
      return;
    }

    try {
      setLoading(true);
      if (selectedRole === 'client_admin') {
        await loginClientAdmin(email.trim(), password);
        toast('Logged into Cafe Admin Portal!', 'success');
        router.push('/admin');
      } else if (selectedRole === 'staff') {
        await loginStaff(email.trim(), password);
        toast('Logged into Staff Scanner Terminal!', 'success');
        router.push('/staff');
      } else if (selectedRole === 'super_admin') {
        await loginSuperAdmin(email.trim(), password);
        toast('Logged into Super Admin Master Console!', 'success');
        router.push('/super-admin');
      }
    } catch (err: any) {
      toast(err.message || 'Login failed. Check your credentials.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '520px', margin: '40px auto 80px', padding: '0 20px' }}>
      <div className="glass-panel" style={{ padding: '36px', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#0c0b0a',
              marginBottom: '16px',
              boxShadow: '0 4px 18px rgba(245, 158, 11, 0.35)',
            }}
          >
            <UserCheck size={28} strokeWidth={2.4} />
          </div>
          <h1 style={{ fontSize: '1.6rem', fontWeight: 800 }}>Portal Authentication</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginTop: '6px' }}>
            Select your portal role to access your dedicated workspace
          </p>
        </div>

        {/* Role Selector Tabs */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '4px',
            borderRadius: 'var(--radius-md)',
            marginBottom: '28px',
          }}
        >
          {[
            { id: 'client_admin', label: 'Cafe Admin', icon: Store },
            { id: 'staff', label: 'Staff POS', icon: Coffee },
            { id: 'super_admin', label: 'Super Admin', icon: Shield },
          ].map((item) => {
            const Icon = item.icon;
            const isSelected = selectedRole === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleRoleSelect(item.id as any)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '10px 8px',
                  borderRadius: '10px',
                  fontSize: '0.78rem',
                  fontWeight: isSelected ? 700 : 500,
                  color: isSelected ? '#0c0b0a' : 'var(--text-secondary)',
                  background: isSelected ? 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)' : 'transparent',
                  transition: 'all 0.2s',
                }}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        <form onSubmit={handleLogin}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Email Address
            </label>
            <input
              type="email"
              required
              placeholder={
                selectedRole === 'client_admin'
                  ? 'admin@cafe.com'
                  : selectedRole === 'staff'
                  ? 'barista@cafe.com'
                  : 'superadmin@trioas.com'
              }
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
            disabled={loading}
            className="btn-primary"
            style={{ width: '100%', padding: '14px', fontSize: '1rem' }}
          >
            {loading ? (
              'Verifying...'
            ) : (
              <>
                <span>Sign In to {selectedRole.replace('_', ' ').toUpperCase()}</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </form>

        <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-card)', paddingTop: '20px', textAlign: 'center' }}>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '8px' }}>
            Are you a cafe customer looking for your stamp card?
          </p>
          <Link
            href="/customer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--accent-gold)',
              fontWeight: 600,
              fontSize: '0.88rem',
            }}
          >
            <QrCode size={16} />
            <span>Open Customer Digital Pass →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
