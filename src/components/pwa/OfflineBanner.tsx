import { Wifi, WifiOff, RefreshCw, Cloud, CloudOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

interface OfflineBannerProps {
  className?: string;
}

export function OfflineBanner({ className }: OfflineBannerProps) {
  const { syncStatus, syncPendingTransactions } = useOfflineSync();

  // Don't show if online and no pending transactions
  if (syncStatus.isOnline && syncStatus.pendingCount === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{ opacity: 1, height: 'auto' }}
        exit={{ opacity: 0, height: 0 }}
        className={cn(
          "w-full",
          className
        )}
      >
        {/* Offline Banner */}
        {!syncStatus.isOnline && (
          <div className="bg-warning/10 border-b border-warning/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-warning/20 flex items-center justify-center">
                  <WifiOff className="h-4 w-4 text-warning" />
                </div>
                <div>
                  <p className="font-medium text-sm text-warning">Mode Offline</p>
                  <p className="text-xs text-muted-foreground">
                    Data akan disinkronkan saat online
                  </p>
                </div>
              </div>
              {syncStatus.pendingCount > 0 && (
                <div className="text-right">
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 rounded-full bg-warning text-warning-foreground text-xs font-bold">
                    {syncStatus.pendingCount}
                  </span>
                  <p className="text-xs text-muted-foreground mt-0.5">Menunggu</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pending Sync Banner (when online but has pending) */}
        {syncStatus.isOnline && syncStatus.pendingCount > 0 && (
          <div className="bg-primary/5 border-b border-primary/20 px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                  <Cloud className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">
                    {syncStatus.isSyncing ? 'Menyinkronkan...' : 'Ada data pending'}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {syncStatus.pendingCount} transaksi menunggu sinkronisasi
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={syncPendingTransactions}
                disabled={syncStatus.isSyncing}
                className="h-8 rounded-lg"
              >
                <RefreshCw className={cn(
                  "h-3.5 w-3.5 mr-1.5",
                  syncStatus.isSyncing && "animate-spin"
                )} />
                Sync
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
