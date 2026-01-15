import { ReactNode } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SoftButtonProps extends Omit<HTMLMotionProps<'button'>, 'children'> {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'ghost' | 'outline';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
}

const variantStyles = {
  primary: 'bg-gradient-primary text-white shadow-float hover:shadow-lg',
  secondary: 'bg-muted text-foreground hover:bg-muted/80',
  success: 'bg-success text-white hover:bg-success/90',
  warning: 'bg-warning text-warning-foreground hover:bg-warning/90',
  ghost: 'bg-transparent text-foreground hover:bg-muted',
  outline: 'bg-white border-2 border-border text-foreground hover:bg-muted/50',
};

const sizeStyles = {
  sm: 'h-10 px-4 text-sm rounded-xl',
  md: 'h-12 px-5 text-sm rounded-xl',
  lg: 'h-14 px-6 text-base rounded-2xl',
  xl: 'h-16 px-8 text-lg rounded-2xl',
};

export function SoftButton({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  icon,
  iconPosition = 'left',
  className,
  disabled,
  ...props
}: SoftButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.98 }}
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-all duration-200',
        'active:scale-[0.98] touch-manipulation',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantStyles[variant],
        sizeStyles[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled}
      {...props}
    >
      {icon && iconPosition === 'left' && icon}
      {children}
      {icon && iconPosition === 'right' && icon}
    </motion.button>
  );
}
