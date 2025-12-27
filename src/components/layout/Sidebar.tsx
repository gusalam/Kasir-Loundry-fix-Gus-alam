import { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
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
import {
  LayoutDashboard,
  ShoppingCart,
  ClipboardList,
  Package,
  Users,
  Tags,
  UserCog,
  FileBarChart,
  Wallet,
  ChevronLeft,
  LogOut,
  Menu,
  Droplets,
  X,
  Receipt,
} from 'lucide-react';

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  adminOnly?: boolean;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export function Sidebar({ isOpen, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { profile, role, logout, isAdmin, user } = useAuth();
  const location = useLocation();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const displayName = profile?.name || user?.email || 'User';
  const basePath = isAdmin ? '/admin' : '/kasir';

  // Navigation items based on role
  const navItems: NavItem[] = isAdmin ? [
    { title: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
    { title: 'Daftar Transaksi', href: '/admin/daftar-transaksi', icon: ClipboardList },
    { title: 'Pengambilan', href: '/admin/pengambilan', icon: Package },
    { title: 'Tutup Kas', href: '/admin/tutup-kas', icon: Wallet },
    { title: 'Customer', href: '/admin/customer', icon: Users },
    { title: 'Layanan', href: '/admin/layanan', icon: Tags },
    { title: 'User Kasir', href: '/admin/user-kasir', icon: UserCog },
    { title: 'Pengeluaran', href: '/admin/pengeluaran', icon: Receipt },
    { title: 'Laporan', href: '/admin/laporan', icon: FileBarChart },
  ] : [
    { title: 'Dashboard', href: '/kasir/dashboard', icon: LayoutDashboard },
    { title: 'Transaksi Baru', href: '/kasir/transaksi-baru', icon: ShoppingCart },
    { title: 'Daftar Transaksi', href: '/kasir/daftar-transaksi', icon: ClipboardList },
    { title: 'Pengambilan', href: '/kasir/pengambilan', icon: Package },
    { title: 'Tutup Kas', href: '/kasir/tutup-kas', icon: Wallet },
  ];

  const handleNavClick = () => {
    // Close sidebar on mobile when nav item is clicked
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleLogoutClick = () => {
    setShowLogoutDialog(true);
  };

  const handleConfirmLogout = () => {
    setShowLogoutDialog(false);
    logout();
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-foreground/20 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-screen bg-gradient-sidebar transition-all duration-300 flex flex-col',
          // Mobile: slide in/out
          'lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full',
          // Desktop: collapsed state
          collapsed ? 'lg:w-16' : 'lg:w-64',
          // Mobile always full width when open
          'w-64'
        )}
      >
        {/* Header */}
        <div className="flex h-16 items-center justify-between px-4 border-b border-sidebar-border">
          <div className={cn('flex items-center gap-3 overflow-hidden', collapsed && 'lg:justify-center')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <img src="/logo.png" alt="Logo" className="h-8 w-8 object-contain" />
            </div>
            {(!collapsed || window.innerWidth < 1024) && (
              <div className="animate-fade-in lg:hidden xl:block">
                <h1 className="text-base font-bold text-sidebar-foreground">POS Laundry</h1>
                <p className="text-xs text-sidebar-muted">Clean & Fresh</p>
              </div>
            )}
            {!collapsed && (
              <div className="animate-fade-in hidden lg:block">
                <h1 className="text-base font-bold text-sidebar-foreground">POS Laundry</h1>
                <p className="text-xs text-sidebar-muted">Clean & Fresh</p>
              </div>
            )}
          </div>
          
          {/* Close button on mobile */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onClose}
            className="text-sidebar-foreground hover:bg-sidebar-accent lg:hidden"
          >
            <X className="h-5 w-5" />
          </Button>

          {/* Collapse button on desktop */}
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onToggleCollapse}
            className="text-sidebar-foreground hover:bg-sidebar-accent hidden lg:flex"
          >
            {collapsed ? <Menu className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
          <ul className="space-y-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== `${basePath}/dashboard` && location.pathname.startsWith(item.href));
              
              return (
                <li key={item.href}>
                  <NavLink
                    to={item.href}
                    onClick={handleNavClick}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                      isActive
                        ? 'bg-primary text-primary-foreground shadow-md'
                        : 'text-sidebar-foreground hover:bg-sidebar-accent',
                      collapsed && 'lg:justify-center lg:px-2'
                    )}
                  >
                    <item.icon className={cn('h-5 w-5 flex-shrink-0', isActive && 'text-primary-foreground')} />
                    <span className={cn(
                      'animate-fade-in truncate',
                      collapsed && 'lg:hidden'
                    )}>
                      {item.title}
                    </span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-3">
          <div className={cn('flex items-center gap-3', collapsed && 'lg:justify-center')}>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent text-sidebar-foreground font-semibold text-sm">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className={cn(
              'flex-1 overflow-hidden animate-fade-in',
              collapsed && 'lg:hidden'
            )}>
              <p className="text-sm font-medium text-sidebar-foreground truncate">{displayName}</p>
              <p className="text-xs text-sidebar-muted capitalize">{role || 'User'}</p>
            </div>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleLogoutClick}
              className={cn(
                'text-sidebar-muted hover:text-sidebar-foreground hover:bg-sidebar-accent',
                collapsed && 'lg:hidden'
              )}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Keluar dari aplikasi?</AlertDialogTitle>
            <AlertDialogDescription>
              Anda akan keluar dari sesi saat ini. Pastikan semua pekerjaan sudah tersimpan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmLogout}>
              Ya, Keluar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}