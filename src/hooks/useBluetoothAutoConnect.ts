import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { capacitorBluetoothPrinter } from '@/lib/capacitor-bluetooth-printer';
import { toast } from 'sonner';

interface UseBluetoothAutoConnectOptions {
  enabled?: boolean;
  showNotification?: boolean;
  retryOnFailure?: boolean;
  maxRetries?: number;
}

/**
 * Hook to auto-reconnect to saved Bluetooth printer when app starts
 * Only works on native Android platform
 */
export function useBluetoothAutoConnect(options: UseBluetoothAutoConnectOptions = {}) {
  const {
    enabled = true,
    showNotification = true,
    retryOnFailure = true,
    maxRetries = 2,
  } = options;

  const attemptedRef = useRef(false);
  const retriesRef = useRef(0);

  useEffect(() => {
    // Only run on native platform
    if (!Capacitor.isNativePlatform()) return;
    
    // Only attempt once per mount
    if (attemptedRef.current) return;
    
    // Check if auto-connect is enabled
    if (!enabled) return;

    // Check if there's a saved printer
    const savedPrinter = capacitorBluetoothPrinter.getSavedPrinter();
    if (!savedPrinter) return;

    // Already connected
    if (capacitorBluetoothPrinter.isConnected()) return;

    const attemptConnection = async () => {
      attemptedRef.current = true;

      try {
        console.log('[AutoConnect] Attempting to connect to saved printer:', savedPrinter.name);
        
        const result = await capacitorBluetoothPrinter.connect(savedPrinter.address);
        
        if (result.success) {
          console.log('[AutoConnect] Successfully connected to:', savedPrinter.name);
          if (showNotification) {
            toast.success(`Printer ${savedPrinter.name} terhubung`, {
              duration: 3000,
              icon: '🖨️',
            });
          }
        } else {
          console.log('[AutoConnect] Failed to connect:', result.error);
          
          // Retry logic
          if (retryOnFailure && retriesRef.current < maxRetries) {
            retriesRef.current++;
            console.log(`[AutoConnect] Retrying... (${retriesRef.current}/${maxRetries})`);
            
            // Wait 2 seconds before retry
            setTimeout(attemptConnection, 2000);
          } else if (showNotification) {
            // Only show notification on final failure
            toast.info(`Printer ${savedPrinter.name} tidak tersedia`, {
              duration: 3000,
              description: 'Nyalakan printer dan coba hubungkan manual',
            });
          }
        }
      } catch (error) {
        console.error('[AutoConnect] Connection error:', error);
        
        if (retryOnFailure && retriesRef.current < maxRetries) {
          retriesRef.current++;
          setTimeout(attemptConnection, 2000);
        }
      }
    };

    // Delay initial connection attempt to let app fully initialize
    const timeoutId = setTimeout(attemptConnection, 1500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [enabled, showNotification, retryOnFailure, maxRetries]);

  // Return function to manually trigger reconnect
  const reconnect = async () => {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'Hanya tersedia di Android' };
    }

    const savedPrinter = capacitorBluetoothPrinter.getSavedPrinter();
    if (!savedPrinter) {
      return { success: false, error: 'Tidak ada printer tersimpan' };
    }

    try {
      const result = await capacitorBluetoothPrinter.connect(savedPrinter.address);
      if (result.success && showNotification) {
        toast.success(`Printer ${savedPrinter.name} terhubung`);
      }
      return result;
    } catch (error: any) {
      return { success: false, error: error.message || 'Gagal menghubungkan' };
    }
  };

  return { reconnect };
}
