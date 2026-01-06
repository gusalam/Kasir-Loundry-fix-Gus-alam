import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard,
  ShoppingCart, 
  Package, 
  ClipboardList,
  Wallet,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface MenuItem {
  icon: ReactNode;
  label: string;
  path: string;
  color: string;
  bgColor: string;
  description?: string;
}

const menuItems: MenuItem[] = [
  {
    icon: <LayoutDashboard className="h-7 w-7" />,
    label: 'Dashboard',
    path: '/kasir/dashboard',
    color: 'text-primary',
    bgColor: 'bg-primary/15',
    description: 'Ringkasan',
  },
  {
    icon: <ShoppingCart className="h-7 w-7" />,
    label: 'Transaksi Baru',
    path: '/kasir/transaksi-baru',
    color: 'text-success',
    bgColor: 'bg-success/15',
    description: 'Buat order',
  },
  {
    icon: <ClipboardList className="h-7 w-7" />,
    label: 'Daftar Transaksi',
    path: '/kasir/daftar-transaksi',
    color: 'text-info',
    bgColor: 'bg-info/15',
    description: 'Lihat semua',
  },
  {
    icon: <Package className="h-7 w-7" />,
    label: 'Pengambilan',
    path: '/kasir/pengambilan',
    color: 'text-warning',
    bgColor: 'bg-warning/15',
    description: 'Siap ambil',
  },
  {
    icon: <Wallet className="h-7 w-7" />,
    label: 'Tutup Kas',
    path: '/kasir/tutup-kas',
    color: 'text-destructive',
    bgColor: 'bg-destructive/15',
    description: 'Akhir shift',
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
  const { impactLight } = useHapticFeedback();

  const handleMenuClick = (path: string) => {
    impactLight();
    navigate(path);
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="grid grid-cols-3 sm:grid-cols-5 gap-3"
    >
      {menuItems.map((item) => (
        <motion.button
          key={item.path}
          variants={itemVariants}
          whileTap={{ scale: 0.95 }}
          onClick={() => handleMenuClick(item.path)}
          className={cn(
            'flex flex-col items-center justify-center p-4 rounded-2xl',
            'border border-border bg-card shadow-sm',
            'active:shadow-none transition-all duration-200',
            'touch-manipulation min-h-[110px]',
            'hover:border-primary/30 hover:shadow-md'
          )}
        >
          <div className={cn(
            'flex items-center justify-center w-14 h-14 rounded-xl mb-2',
            item.bgColor,
            item.color
          )}>
            {item.icon}
          </div>
          <span className="text-xs font-semibold text-foreground text-center leading-tight">
            {item.label}
          </span>
          {item.description && (
            <span className="text-[10px] text-muted-foreground text-center mt-0.5">
              {item.description}
            </span>
          )}
        </motion.button>
      ))}
    </motion.div>
  );
}
