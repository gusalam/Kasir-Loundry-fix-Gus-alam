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
      <nav className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-lg border-t border-border/50 z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-20 max-w-lg mx-auto px-2">
          {navItems.map((item, index) => {
            const isActive = location.pathname === item.path || 
              (item.path !== '/admin/dashboard' && item.path !== '/kasir/dashboard' && location.pathname.startsWith(item.path));
            const isCenter = index === Math.floor(navItems.length / 2);
            
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center gap-1.5 transition-all duration-300 relative',
                  'active:scale-95 touch-manipulation',
                  isCenter 
                    ? 'w-20 h-16 -mt-4 rounded-2xl bg-primary/10 border border-primary/20' 
                    : 'w-16 h-full',
                  isActive 
                    ? isCenter 
                      ? 'bg-primary/20 border-primary/40 text-primary shadow-lg shadow-primary/20' 
                      : 'text-primary'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <item.icon className={cn(
                  'transition-all duration-300',
                  isCenter ? 'h-7 w-7' : 'h-6 w-6',
                  isActive && 'scale-110'
                )} strokeWidth={isActive ? 2.5 : 2} />
                <span className={cn(
                  'font-medium transition-all duration-200',
                  isCenter ? 'text-[10px]' : 'text-[11px]',
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
