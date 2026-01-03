import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Home, ShoppingCart, History, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { KasirHeader } from './KasirHeader';

interface KasirLayoutProps {
  children: ReactNode;
}

const bottomNavItems = [
  { icon: Home, label: 'Beranda', path: '/kasir/dashboard' },
  { icon: ShoppingCart, label: 'Transaksi', path: '/kasir/transaksi-baru' },
  { icon: History, label: 'Riwayat', path: '/kasir/daftar-transaksi' },
  { icon: User, label: 'Akun', path: '/kasir/akun' },
];

export function KasirLayout({ children }: KasirLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  // Check if current path matches or starts with the nav item path
  const isPathActive = (itemPath: string) => {
    if (itemPath === '/kasir/dashboard') {
      return location.pathname === itemPath;
    }
    return location.pathname.startsWith(itemPath);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Fixed Header - NO SIDEBAR */}
      <KasirHeader />

      {/* Spacer for fixed header (taller on mobile due to shift info) */}
      <div className="h-[88px] sm:h-[72px] safe-area-top" />

      {/* Main content - FULL WIDTH, no sidebar margin */}
      <main className="flex-1 overflow-y-auto pb-20 w-full">
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="p-4 w-full max-w-4xl mx-auto"
        >
          {children}
        </motion.div>
      </main>

      {/* Bottom Navigation - ONLY NAVIGATION, NO SIDEBAR */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = isPathActive(item.path);
            
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
