import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ChevronRight } from 'lucide-react';

interface MobileCardProps {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  showArrow?: boolean;
}

export function MobileCard({ children, onClick, className, showArrow }: MobileCardProps) {
  const Component = onClick ? motion.button : motion.div;
  
  return (
    <Component
      onClick={onClick}
      className={cn(
        'w-full p-4 rounded-2xl bg-card border border-border text-left',
        'transition-all duration-200 shadow-card',
        onClick && 'active:scale-[0.99] touch-manipulation cursor-pointer hover:shadow-elevated',
        className
      )}
      whileTap={onClick ? { scale: 0.99 } : undefined}
    >
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          {children}
        </div>
        {showArrow && onClick && (
          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        )}
      </div>
    </Component>
  );
}
