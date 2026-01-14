import { ReactNode } from 'react';
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
  default: 'bg-white border-border/30',
  primary: 'bg-[hsl(200,85%,95%)] border-[hsl(200,85%,88%)]',
  success: 'bg-[hsl(155,60%,92%)] border-[hsl(155,60%,85%)]',
  warning: 'bg-[hsl(45,100%,92%)] border-[hsl(45,100%,85%)]',
  info: 'bg-[hsl(200,85%,95%)] border-[hsl(200,85%,88%)]',
  danger: 'bg-[hsl(340,70%,94%)] border-[hsl(340,70%,88%)]',
};

const iconVariantStyles = {
  default: 'bg-muted text-muted-foreground',
  primary: 'bg-primary/20 text-primary',
  success: 'bg-success/20 text-success',
  warning: 'bg-warning/25 text-warning-foreground',
  info: 'bg-info/20 text-info',
  danger: 'bg-destructive/15 text-destructive',
};

const textColors = {
  default: 'text-foreground',
  primary: 'text-[hsl(200,90%,35%)]',
  success: 'text-[hsl(155,65%,30%)]',
  warning: 'text-[hsl(40,80%,25%)]',
  info: 'text-[hsl(200,90%,35%)]',
  danger: 'text-[hsl(340,70%,35%)]',
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
        'w-full p-4 rounded-2xl border-2 text-left transition-all shadow-card',
        'active:scale-[0.98] touch-manipulation',
        variantStyles[variant],
        onClick && 'cursor-pointer'
      )}
      whileTap={onClick ? { scale: 0.98 } : undefined}
    >
      <div className="flex items-start gap-3">
        <div className={cn(
          'flex items-center justify-center w-11 h-11 rounded-xl flex-shrink-0',
          iconVariantStyles[variant]
        )}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-muted-foreground mb-0.5">{title}</p>
          <p className={cn(
            'text-xl font-bold truncate',
            textColors[variant]
          )}>{value}</p>
          {subtitle && (
            <p className="text-[10px] text-muted-foreground mt-0.5">{subtitle}</p>
          )}
        </div>
      </div>
    </Component>
  );
}
