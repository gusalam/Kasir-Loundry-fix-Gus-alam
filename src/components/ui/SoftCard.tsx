import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface SoftCardProps {
  children: ReactNode;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  padding?: 'sm' | 'md' | 'lg';
}

const variantStyles = {
  default: 'bg-white border-border/50',
  primary: 'bg-[hsl(200,85%,96%)] border-[hsl(200,85%,90%)]',
  success: 'bg-[hsl(155,60%,95%)] border-[hsl(155,60%,88%)]',
  warning: 'bg-[hsl(45,100%,95%)] border-[hsl(45,100%,88%)]',
  danger: 'bg-[hsl(0,70%,97%)] border-[hsl(0,70%,92%)]',
  info: 'bg-[hsl(200,85%,96%)] border-[hsl(200,85%,90%)]',
};

const paddingStyles = {
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-5',
};

export function SoftCard({
  children,
  variant = 'default',
  className,
  padding = 'md',
}: SoftCardProps) {
  return (
    <div
      className={cn(
        'rounded-2xl border shadow-card',
        variantStyles[variant],
        paddingStyles[padding],
        className
      )}
    >
      {children}
    </div>
  );
}
