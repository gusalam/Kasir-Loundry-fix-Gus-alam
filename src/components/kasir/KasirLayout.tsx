import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KasirHeader } from './KasirHeader';

interface KasirLayoutProps {
  children: ReactNode;
  storeName?: string;
}

const bottomNavItems = [
  { icon: Home, label: 'Beranda', path: '/kasir/dashboard' },
  { icon: ShoppingCart, label: 'Kasir', path: '/kasir/transaksi-baru' },
  { icon: History, label: 'Riwayat', path: '/kasir/daftar-transaksi' },
  { icon: User, label: 'Akun', path: '/kasir/akun' },
];

export function KasirLayout({ children, storeName }: KasirLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Fixed Header */}
      <KasirHeader storeName={storeName} />

      {/* Spacer for fixed header */}
      <div className="h-[72px] safe-area-top" />

      {/* Main content with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto pb-20">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/kasir/dashboard' && location.pathname.startsWith(item.path));
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative',
                  'active:scale-95 touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="kasirBottomNavIndicator"
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-b-full"
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  />
                )}
                <item.icon className={cn(
                  'h-6 w-6 transition-transform duration-200',
                  isActive && 'scale-110'
                )} />
                <span className={cn(
                  'text-[11px] font-medium',
                  isActive && 'font-semibold'
                )}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
