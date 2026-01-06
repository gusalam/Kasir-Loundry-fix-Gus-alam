import { useState, useRef, useCallback, ReactNode } from 'react';
import { motion, useAnimation, PanInfo } from 'framer-motion';
import { Loader2, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  className?: string;
  disabled?: boolean;
}

const PULL_THRESHOLD = 80;
const RESISTANCE = 2.5;

export function PullToRefresh({ 
  children, 
  onRefresh, 
  className,
  disabled = false 
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const { impactMedium, notifySuccess } = useHapticFeedback();

  const canPull = useCallback(() => {
    if (disabled || isRefreshing) return false;
    const container = containerRef.current;
    if (!container) return false;
    return container.scrollTop <= 0;
  }, [disabled, isRefreshing]);

  const handlePanStart = useCallback(() => {
    if (!canPull()) return;
  }, [canPull]);

  const handlePan = useCallback((event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    if (!canPull()) return;
    
    const offset = info.offset.y;
    if (offset > 0) {
      const distance = Math.min(offset / RESISTANCE, PULL_THRESHOLD * 1.5);
      setPullDistance(distance);
      
      if (distance >= PULL_THRESHOLD && pullDistance < PULL_THRESHOLD) {
        impactMedium();
      }
    }
  }, [canPull, pullDistance, impactMedium]);

  const handlePanEnd = useCallback(async () => {
    if (pullDistance >= PULL_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
        notifySuccess();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    controls.start({ y: 0 });
  }, [pullDistance, isRefreshing, onRefresh, controls, notifySuccess]);

  const progress = Math.min(pullDistance / PULL_THRESHOLD, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div 
      ref={containerRef}
      className={cn('relative overflow-auto h-full', className)}
    >
      {/* Pull Indicator */}
      <motion.div
        className={cn(
          'absolute left-0 right-0 flex items-center justify-center z-10 pointer-events-none',
          'transition-opacity duration-200'
        )}
        style={{
          top: -40,
          height: 40,
          transform: `translateY(${showIndicator ? pullDistance : 0}px)`,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div className={cn(
          'flex items-center justify-center w-10 h-10 rounded-full',
          'bg-card border border-border shadow-lg',
        )}>
          {isRefreshing ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          ) : (
            <motion.div
              animate={{ rotate: progress >= 1 ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ArrowDown 
                className={cn(
                  'h-5 w-5 transition-colors',
                  progress >= 1 ? 'text-primary' : 'text-muted-foreground'
                )} 
              />
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        animate={controls}
        onPanStart={handlePanStart}
        onPan={handlePan}
        onPanEnd={handlePanEnd}
        style={{
          transform: `translateY(${pullDistance}px)`,
          touchAction: canPull() ? 'pan-x' : 'auto',
        }}
        className="min-h-full"
      >
        {children}
      </motion.div>
    </div>
  );
}
