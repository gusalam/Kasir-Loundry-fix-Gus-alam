import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Users, 
  Wrench, 
  UserCog, 
  Wallet, 
  ClipboardList, 
  Settings,
  ChevronRight,
  LogOut,
} from 'lucide-react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
import { cn } from '@/lib/utils';

const menuItems = [
  { 
    icon: Users, 
    label: 'Customer', 
    path: '/admin/customer', 
    description: 'Kelola data pelanggan',
    color: 'bg-info text-info-foreground'
  },
  { 
    icon: Wrench, 
    label: 'Layanan', 
    path: '/admin/layanan', 
    description: 'Kelola jenis layanan',
    color: 'bg-warning text-warning-foreground'
  },
  { 
    icon: UserCog, 
    label: 'User Kasir', 
    path: '/admin/users', 
    description: 'Kelola akun kasir',
    color: 'bg-secondary text-secondary-foreground'
  },
  { 
    icon: Wallet, 
    label: 'Pengeluaran', 
    path: '/admin/pengeluaran', 
    description: 'Catat pengeluaran',
    color: 'bg-destructive text-destructive-foreground'
  },
  { 
    icon: ClipboardList, 
    label: 'Tutup Kas', 
    path: '/admin/tutup-kas', 
    description: 'Rekap tutup kas harian',
    color: 'bg-success text-success-foreground'
  },
  { 
    icon: Settings, 
    label: 'Pengaturan', 
    path: '/admin/pengaturan', 
    description: 'Pengaturan aplikasi',
    color: 'bg-muted text-muted-foreground'
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function AdminMenu() {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <AdminLayout title="Menu">
      <div className="space-y-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Menu Admin</h2>
          <p className="text-sm text-muted-foreground">Kelola semua pengaturan sistem</p>
        </div>

        <motion.div 
          className="space-y-3"
          variants={containerVariants}
          initial="hidden"
          animate="visible"
        >
          {menuItems.map((item) => (
            <motion.button
              key={item.path}
              variants={itemVariants}
              onClick={() => navigate(item.path)}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-4 p-4 bg-card rounded-2xl border-2 border-border transition-all active:scale-[0.98] touch-manipulation hover:border-primary/30"
            >
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0',
                item.color
              )}>
                <item.icon className="h-7 w-7" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold text-foreground text-base">{item.label}</p>
                <p className="text-sm text-muted-foreground">{item.description}</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </motion.button>
          ))}
        </motion.div>

        {/* Logout Button */}
        <Button 
          variant="outline" 
          className="w-full h-14 text-base rounded-2xl border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
          onClick={() => setShowLogoutDialog(true)}
        >
          <LogOut className="h-5 w-5 mr-2" />
          Keluar dari Akun
        </Button>
      </div>

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
    </AdminLayout>
  );
}
