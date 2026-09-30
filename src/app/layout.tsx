import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/components/ui/Toast';
import { Navbar } from '@/components/layout/Navbar';

export const metadata: Metadata = {
  title: 'TRIOAS - Smart Cafe Loyalty & Rewards OS',
  description: 'Multi-tenant Cafe Loyalty, Stamp Cards, Barista QR Scanner & Rewards Management Platform',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <ToastProvider>
            <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
              <Navbar />
              <main style={{ flex: 1 }}>{children}</main>
            </div>
          </ToastProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
