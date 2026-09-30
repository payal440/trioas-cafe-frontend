'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastContextType {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: ToastType = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 9999,
          display: 'flex',
          flexDirection: 'column',
          gap: '10px',
          maxWidth: '420px',
          pointerEvents: 'none',
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              padding: '14px 18px',
              borderRadius: '12px',
              background:
                t.type === 'success'
                  ? 'rgba(6, 78, 59, 0.95)'
                  : t.type === 'error'
                  ? 'rgba(127, 29, 29, 0.95)'
                  : 'rgba(30, 27, 24, 0.95)',
              border: `1px solid ${
                t.type === 'success'
                  ? 'rgba(16, 185, 129, 0.4)'
                  : t.type === 'error'
                  ? 'rgba(244, 63, 94, 0.4)'
                  : 'rgba(245, 158, 11, 0.3)'
              }`,
              color: '#fff',
              boxShadow: '0 10px 30px rgba(0,0,0,0.5)',
              backdropFilter: 'blur(10px)',
              animation: 'fadeIn 0.25s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.9rem', fontWeight: 500 }}>
              {t.type === 'success' && <CheckCircle2 size={18} color="#34d399" />}
              {t.type === 'error' && <AlertCircle size={18} color="#fb7185" />}
              {t.type === 'info' && <Info size={18} color="#fbbf24" />}
              <span>{t.message}</span>
            </div>
            <button
              onClick={() => removeToast(t.id)}
              style={{
                color: 'rgba(255,255,255,0.6)',
                display: 'flex',
                alignItems: 'center',
                padding: '4px',
              }}
            >
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};
