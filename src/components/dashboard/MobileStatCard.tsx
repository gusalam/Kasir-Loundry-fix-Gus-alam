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
  default: 'bg-card border-border/50 shadow-card',
  primary: 'bg-pastel-blue border-primary/10 shadow-card',
  success: 'bg-pastel-green border-success/10 shadow-card',
  warning: 'bg-pastel-yellow border-warning/10 shadow-card',
  info: 'bg-pastel-blue border-info/10 shadow-card',
  danger: 'bg-pastel-pink border-destructive/10 shadow-card',
};

const iconVariantStyles = {
  default: 'bg-muted/80 text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/20 text-warning-foreground',
  info: 'bg-info/20 text-info',
  danger: 'bg-destructive/20 text-destructive',
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
