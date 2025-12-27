import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface MobileActionButtonProps {
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'success' | 'warning';
  size?: 'default' | 'lg' | 'xl';
  showArrow?: boolean;
  disabled?: boolean;
  className?: string;
}

const variantStyles = {
  primary: 'bg-gradient-primary text-primary-foreground shadow-glow-primary',
  secondary: 'bg-secondary text-secondary-foreground',
  outline: 'bg-card border-2 border-border text-foreground',
  success: 'bg-success text-success-foreground',
  warning: 'bg-warning text-warning-foreground',
};

const sizeStyles = {
  default: 'h-12 px-5 text-base',
  lg: 'h-14 px-6 text-lg',
  xl: 'h-16 px-8 text-xl',
};

export function MobileActionButton({
  children,
  icon,
  onClick,
  variant = 'primary',
  size = 'default',
  showArrow,
  disabled,
  className,
}: MobileActionButtonProps) {
  return (
    <motion.button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'w-full flex items-center justify-center gap-3 rounded-2xl font-semibold',
        'transition-all duration-200 active:scale-[0.98] touch-manipulation',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        className
      )}
      whileTap={disabled ? undefined : { scale: 0.98 }}
    >
      {icon && <span className="flex-shrink-0">{icon}</span>}
      <span className="truncate">{children}</span>
      {showArrow && <ChevronRight className="h-5 w-5 flex-shrink-0" />}
    </motion.button>
  );
}
