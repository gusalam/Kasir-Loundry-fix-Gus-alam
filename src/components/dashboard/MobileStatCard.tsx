import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface MobileStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger';
  onClick?: () => void;
}

const variantStyles = {
  default: 'bg-card border-border',
  primary: 'bg-primary/10 border-primary/20',
  success: 'bg-success/10 border-success/20',
  warning: 'bg-warning/10 border-warning/20',
  info: 'bg-info/10 border-info/20',
  danger: 'bg-destructive/10 border-destructive/20',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary text-primary-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
  info: 'bg-info text-info-foreground',
  danger: 'bg-destructive text-destructive-foreground',
};

export function MobileStatCard({ 
  title, 
  value, 
  subtitle,
  icon, 
  variant = 'default',
  onClick 
}: MobileStatCardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-2xl border-2 text-left transition-all',
        'active:scale-[0.98] touch-manipulation',
        variantStyles[variant],
        onClick && 'cursor-pointer'
      )}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex items-center justify-center w-12 h-12 rounded-xl flex-shrink-0',
          iconVariantStyles[variant]
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground truncate">{title}</p>
          <p className="text-xl font-bold text-foreground truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
    </Component>
  );
}
