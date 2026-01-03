import { ReactNode, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Home, 
  ShoppingCart, 
  Package, 
  FileBarChart, 
  Menu,
  LogOut,
  Users,
  Wrench,
  UserCog,
  Wallet,
  ClipboardList,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface AdminLayoutProps {
  children: ReactNode;
  title?: string;
}

const bottomNavItems = [
  { icon: Home, label: 'Dashboard', path: '/admin/dashboard' },
  { icon: ShoppingCart, label: 'Transaksi', path: '/admin/daftar-transaksi' },
  { icon: Package, label: 'Pengambilan', path: '/admin/pengambilan' },
  { icon: FileBarChart, label: 'Laporan', path: '/admin/laporan' },
  { icon: Menu, label: 'Menu', path: '/admin/menu' },
];

const menuItems = [
  { icon: Users, label: 'Customer', path: '/admin/customer', description: 'Kelola data pelanggan' },
  { icon: Wrench, label: 'Layanan', path: '/admin/layanan', description: 'Kelola jenis layanan' },
  { icon: UserCog, label: 'User Kasir', path: '/admin/users', description: 'Kelola akun kasir' },
  { icon: Wallet, label: 'Pengeluaran', path: '/admin/pengeluaran', description: 'Catat pengeluaran' },
  { icon: ClipboardList, label: 'Tutup Kas', path: '/admin/tutup-kas', description: 'Rekap tutup kas harian' },
  { icon: Settings, label: 'Pengaturan', path: '/admin/pengaturan', description: 'Pengaturan aplikasi' },
];

export function AdminLayout({ children, title }: AdminLayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, profile } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const isPathActive = (itemPath: string) => {
    if (itemPath === '/admin/dashboard') {
      return location.pathname === itemPath;
    }
    if (itemPath === '/admin/menu') {
      return location.pathname === '/admin/menu' || 
        menuItems.some(m => location.pathname.startsWith(m.path));
    }
    return location.pathname.startsWith(itemPath);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const handleNavClick = (path: string) => {
    if (path === '/admin/menu') {
      setMenuOpen(true);
    } else {
      navigate(path);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col w-full">
      {/* Fixed Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-card border-b border-border safe-area-top">
        <div className="flex items-center justify-between h-14 px-4 max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">PL</span>
            </div>
            <div>
              <h1 className="text-sm font-bold text-foreground leading-tight">
                {title || 'Admin Panel'}
              </h1>
              <p className="text-[10px] text-muted-foreground">
                {profile?.name || 'Administrator'}
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Spacer for fixed header */}
      <div className="h-14 safe-area-top" />

      {/* Main content */}
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

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.1)] z-50 safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto">
          {bottomNavItems.map((item) => {
            const isActive = isPathActive(item.path);
            
            return (
              <button
                key={item.path}
                onClick={() => handleNavClick(item.path)}
                className={cn(
                  'flex flex-col items-center justify-center w-full h-full gap-1 transition-all duration-200 relative',
                  'active:scale-95 touch-manipulation',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="adminBottomNavIndicator"
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

      {/* Menu Sheet */}
      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="bottom" className="rounded-t-3xl max-h-[85vh]">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-left">Menu Admin</SheetTitle>
          </SheetHeader>
          
          <div className="space-y-2 pb-4">
            {menuItems.map((item) => (
              <button
                key={item.path}
                onClick={() => {
                  navigate(item.path);
                  setMenuOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl transition-all',
                  'active:scale-[0.98] touch-manipulation',
                  location.pathname.startsWith(item.path) 
                    ? 'bg-primary/10 border-2 border-primary/20' 
                    : 'bg-muted/50 hover:bg-muted border-2 border-transparent'
                )}
              >
                <div className={cn(
                  'w-12 h-12 rounded-xl flex items-center justify-center',
                  location.pathname.startsWith(item.path)
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground'
                )}>
                  <item.icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <p className="font-semibold text-foreground">{item.label}</p>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            ))}
          </div>
          
          {/* Logout Button */}
          <div className="border-t pt-4">
            <Button 
              variant="destructive" 
              className="w-full h-14 text-base rounded-2xl"
              onClick={() => {
                setMenuOpen(false);
                setShowLogoutDialog(true);
              }}
            >
              <LogOut className="h-5 w-5 mr-2" />
              Keluar dari Akun
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Logout Confirmation */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Logout</AlertDialogTitle>
            <AlertDialogDescription>
              Apakah Anda yakin ingin keluar dari akun?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
