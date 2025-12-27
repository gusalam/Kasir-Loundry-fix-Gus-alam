import { ReactNode } from 'react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  description?: string;
  icon: ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  badge?: {
    text: string;
    variant: 'warning' | 'danger' | 'info' | 'success';
  };
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'info' | 'danger';
}

const variantStyles = {
  default: 'bg-card',
  primary: 'bg-primary-light border-primary/20',
  success: 'bg-success-light border-success/20',
  warning: 'bg-warning-light border-warning/20',
  info: 'bg-info-light border-info/20',
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

const badgeStyles = {
  warning: 'bg-warning/20 text-warning border border-warning/30',
  danger: 'bg-destructive/20 text-destructive border border-destructive/30',
  info: 'bg-info/20 text-info border border-info/30',
  success: 'bg-success/20 text-success border border-success/30',
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  description,
  icon, 
  trend,
  badge,
  variant = 'default' 
}: StatCardProps) {
  return (
    <Card 
      variant="stat" 
      className={cn(
        'p-5 transition-all duration-200 hover:scale-[1.02]',
        variantStyles[variant]
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1 flex-1 min-w-0">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground truncate">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
          {description && (
            <p className="text-[10px] text-muted-foreground/70 leading-tight">{description}</p>
          )}
          {trend && (
            <div className={cn(
              'flex items-center gap-1 text-xs font-medium',
              trend.isPositive ? 'text-success' : 'text-danger'
            )}>
              {trend.isPositive ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span>{trend.value}% dari kemarin</span>
            </div>
          )}
          {badge && (
            <div className={cn(
              'inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full mt-1',
              badgeStyles[badge.variant]
            )}>
              <AlertCircle className="h-3 w-3" />
              <span>{badge.text}</span>
            </div>
          )}
        </div>
        <div className={cn(
          'flex h-12 w-12 items-center justify-center rounded-xl flex-shrink-0',
          iconVariantStyles[variant]
        )}>
          {icon}
        </div>
      </div>
    </Card>
  );
}
