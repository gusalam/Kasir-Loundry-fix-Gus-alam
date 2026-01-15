import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface IllustratedStatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: ReactNode;
  illustration?: 'orders' | 'revenue' | 'expense' | 'profit' | 'pending' | 'ready' | 'process';
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'mint';
  onClick?: () => void;
}

// Flat illustration patterns for each type
const IllustrationPatterns = {
  orders: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <rect x="30" y="25" width="40" height="50" rx="4" fill="currentColor" opacity="0.3" />
      <rect x="35" y="35" width="20" height="3" rx="1" fill="currentColor" opacity="0.6" />
      <rect x="35" y="42" width="25" height="3" rx="1" fill="currentColor" opacity="0.5" />
      <rect x="35" y="49" width="15" height="3" rx="1" fill="currentColor" opacity="0.4" />
      <circle cx="65" cy="65" r="15" fill="currentColor" opacity="0.2" />
      <path d="M58 65 L63 70 L72 60" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.8" />
    </svg>
  ),
  revenue: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <path d="M30 70 L50 50 L65 60 L80 35" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
      <circle cx="30" cy="70" r="5" fill="currentColor" opacity="0.4" />
      <circle cx="50" cy="50" r="5" fill="currentColor" opacity="0.5" />
      <circle cx="65" cy="60" r="5" fill="currentColor" opacity="0.6" />
      <circle cx="80" cy="35" r="6" fill="currentColor" opacity="0.8" />
      <path d="M75 35 L85 30" stroke="currentColor" strokeWidth="3" fill="none" opacity="0.7" strokeLinecap="round" />
    </svg>
  ),
  expense: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.2" />
      <path d="M50 30 L50 70" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" />
      <path d="M40 40 L50 30 L60 40" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.6" strokeLinecap="round" strokeLinejoin="round" />
      <rect x="35" y="75" width="30" height="8" rx="2" fill="currentColor" opacity="0.3" />
    </svg>
  ),
  profit: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <rect x="25" y="60" width="15" height="25" rx="3" fill="currentColor" opacity="0.3" />
      <rect x="42" y="45" width="15" height="40" rx="3" fill="currentColor" opacity="0.5" />
      <rect x="59" y="30" width="15" height="55" rx="3" fill="currentColor" opacity="0.7" />
      <circle cx="70" cy="20" r="12" fill="currentColor" opacity="0.2" />
      <text x="70" y="24" textAnchor="middle" fontSize="12" fill="currentColor" opacity="0.8">Rp</text>
    </svg>
  ),
  pending: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="50" r="30" fill="currentColor" opacity="0.2" />
      <path d="M50 30 L50 55 L65 65" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.7" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.8" />
    </svg>
  ),
  ready: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <rect x="30" y="35" width="40" height="35" rx="4" fill="currentColor" opacity="0.25" />
      <rect x="25" y="30" width="50" height="10" rx="3" fill="currentColor" opacity="0.4" />
      <path d="M40 55 L47 62 L62 47" stroke="currentColor" strokeWidth="4" fill="none" opacity="0.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  process: (
    <svg viewBox="0 0 100 100" className="w-full h-full">
      <circle cx="50" cy="50" r="45" fill="currentColor" opacity="0.1" />
      <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="6" opacity="0.3" />
      <path d="M50 25 A25 25 0 0 1 75 50" stroke="currentColor" strokeWidth="6" fill="none" opacity="0.7" strokeLinecap="round" />
      <circle cx="75" cy="50" r="5" fill="currentColor" opacity="0.8" />
    </svg>
  ),
};

const variantStyles = {
  primary: {
    bg: 'bg-[hsl(200,85%,94%)]',
    border: 'border-[hsl(200,85%,85%)]',
    icon: 'text-primary',
    text: 'text-[hsl(200,80%,30%)]',
  },
  success: {
    bg: 'bg-[hsl(155,60%,92%)]',
    border: 'border-[hsl(155,60%,85%)]',
    icon: 'text-success',
    text: 'text-[hsl(155,65%,25%)]',
  },
  warning: {
    bg: 'bg-[hsl(45,100%,92%)]',
    border: 'border-[hsl(45,100%,85%)]',
    icon: 'text-[hsl(40,80%,40%)]',
    text: 'text-[hsl(40,80%,25%)]',
  },
  danger: {
    bg: 'bg-[hsl(0,70%,95%)]',
    border: 'border-[hsl(0,70%,88%)]',
    icon: 'text-danger',
    text: 'text-[hsl(0,60%,35%)]',
  },
  info: {
    bg: 'bg-[hsl(200,85%,94%)]',
    border: 'border-[hsl(200,85%,85%)]',
    icon: 'text-info',
    text: 'text-[hsl(200,80%,30%)]',
  },
  purple: {
    bg: 'bg-[hsl(270,60%,94%)]',
    border: 'border-[hsl(270,60%,88%)]',
    icon: 'text-[hsl(270,60%,50%)]',
    text: 'text-[hsl(270,50%,30%)]',
  },
  mint: {
    bg: 'bg-[hsl(170,55%,92%)]',
    border: 'border-[hsl(170,55%,85%)]',
    icon: 'text-[hsl(170,55%,40%)]',
    text: 'text-[hsl(170,50%,25%)]',
  },
};

export function IllustratedStatCard({
  title,
  value,
  subtitle,
  icon,
  illustration = 'orders',
  variant = 'primary',
  onClick,
}: IllustratedStatCardProps) {
  const styles = variantStyles[variant];
  const IllustrationSVG = IllustrationPatterns[illustration];

  const CardWrapper = onClick ? motion.button : motion.div;

  return (
    <CardWrapper
      whileTap={onClick ? { scale: 0.98 } : undefined}
      onClick={onClick}
      className={cn(
        'relative overflow-hidden rounded-2xl p-4 border-2 shadow-card transition-all',
        styles.bg,
        styles.border,
        onClick && 'cursor-pointer active:scale-[0.98] touch-manipulation'
      )}
    >
      {/* Background Illustration */}
      <div className={cn('absolute right-0 top-0 w-20 h-20 -mr-2 -mt-2 opacity-60', styles.icon)}>
        {IllustrationSVG}
      </div>

      {/* Content */}
      <div className="relative z-10">
        <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center mb-3', styles.icon, 'bg-white/60')}>
          {icon}
        </div>
        <p className={cn('text-2xl font-bold', styles.text)}>{value}</p>
        <p className="text-sm font-medium text-muted-foreground mt-0.5">{title}</p>
        {subtitle && (
          <p className="text-xs text-muted-foreground/70 mt-1">{subtitle}</p>
        )}
      </div>
    </CardWrapper>
  );
}
