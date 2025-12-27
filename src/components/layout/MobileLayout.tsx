import { ReactNode } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  ShoppingCart, 
  Package, 
  Wallet, 
  User,
  BarChart3,
  Users,
  Settings,
  Receipt,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MobileTopbar } from './MobileTopbar';

interface MobileLayoutProps {
  children: ReactNode;
  title: string;
  showBack?: boolean;
  role: 'admin' | 'kasir';
}

// Admin navigation items
const adminNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: ShoppingCart, label: 'Transaksi', path: '/admin/daftar-transaksi' },
  { icon: Package, label: 'Ambil', path: '/admin/pengambilan' },
  { icon: Wallet, label: 'Tutup Kas', path: '/admin/tutup-kas' },
  { icon: BarChart3, label: 'Laporan', path: '/admin/laporan' },
];

// Kasir navigation items
const kasirNavItems = [
  { icon: LayoutDashboard, label: 'Dashboard', path: '/kasir/dashboard' },
  { icon: ShoppingCart, label: 'Transaksi', path: '/kasir/daftar-transaksi' },
  { icon: Package, label: 'Ambil', path: '/kasir/pengambilan' },
  { icon: Wallet, label: 'Tutup Kas', path: '/kasir/tutup-kas' },
  { icon: User, label: 'Akun', path: '/kasir/akun' },
];

export function MobileLayout({ children, title, showBack, role }: MobileLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  const navItems = role === 'admin' ? adminNavItems : kasirNavItems;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <MobileTopbar title={title} showBack={showBack} />

      {/* Main content with bottom padding for nav */}
      <main className="flex-1 overflow-y-auto pb-24">
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
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-lg z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin/dashboard' && item.path !== '/kasir/dashboard' && location.pathname.startsWith(item.path));
            
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
                    layoutId="bottomNavIndicator"
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
