import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  History, 
  FileText, 
  Settings 
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  color: string;
  bgColor: string;
}

const menuItems: MenuItem[] = [
  {
    icon: <ShoppingCart className="h-7 w-7" />,
    label: 'Transaksi Baru',
    path: '/kasir/transaksi-baru',
    color: 'text-primary',
    bgColor: 'bg-primary/15',
  },
  {
    icon: <Package className="h-7 w-7" />,
    label: 'Pengambilan',
    path: '/kasir/pengambilan',
    color: 'text-success',
    bgColor: 'bg-success/15',
  },
  {
    icon: <Users className="h-7 w-7" />,
    label: 'Pelanggan',
    path: '/kasir/pelanggan',
    color: 'text-info',
    bgColor: 'bg-info/15',
  },
  {
    icon: <History className="h-7 w-7" />,
    label: 'Riwayat',
    path: '/kasir/daftar-transaksi',
    color: 'text-warning',
    bgColor: 'bg-warning/15',
  },
  {
    icon: <FileText className="h-7 w-7" />,
    label: 'Tutup Kas',
    path: '/kasir/tutup-kas',
    color: 'text-destructive',
    bgColor: 'bg-destructive/15',
  },
  {
    icon: <Settings className="h-7 w-7" />,
    label: 'Pengaturan',
    path: '/kasir/pengaturan',
    color: 'text-muted-foreground',
    bgColor: 'bg-muted',
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export function MenuGrid() {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 gap-3"
    >
      {menuItems.map((item) => (
        <motion.button
          key={item.path}
          variants={itemVariants}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(item.path)}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-2xl',
            'border border-border bg-card shadow-sm',
            'active:shadow-none transition-all duration-200',
            'touch-manipulation min-h-[100px]'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-14 h-14 rounded-xl mb-2',
            item.bgColor,
            item.color
          )}>
            {item.icon}
          </div>
          <span className="text-xs font-medium text-foreground text-center leading-tight">
            {item.label}
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
}
