import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface QuickStatCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning';
}

const variantStyles = {
  default: {
    bg: 'bg-card',
    icon: 'bg-muted text-muted-foreground',
  },
  primary: {
    bg: 'bg-primary/10',
    icon: 'bg-primary text-primary-foreground',
  },
  success: {
    bg: 'bg-success/10',
    icon: 'bg-success text-success-foreground',
  },
  warning: {
    bg: 'bg-warning/10',
    icon: 'bg-warning text-warning-foreground',
  },
};

export function QuickStatCard({ 
  title, 
  value, 
  icon, 
  variant = 'default' 
}: QuickStatCardProps) {
  const styles = variantStyles[variant];

  return (
    <motion.div
      whileTap={{ scale: 0.98 }}
      className={cn(
        'rounded-2xl p-4 border border-border shadow-sm',
        styles.bg
      )}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0',
          styles.icon
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-lg font-bold text-foreground truncate">{value}</p>
        </div>
      </div>
    </motion.div>
  );
}
