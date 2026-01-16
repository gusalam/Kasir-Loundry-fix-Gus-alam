import { useBluetoothAutoConnect } from '@/hooks/useBluetoothAutoConnect';

/**
 * Component that handles auto-reconnecting to saved Bluetooth printer
 * Place this component in the app root to enable auto-connect on app start
 */
export function BluetoothAutoConnect() {
  // This hook handles the auto-connect logic
  useBluetoothAutoConnect({
    enabled: true,
    showNotification: true,
    retryOnFailure: true,
    maxRetries: 2,
  });

  // This component doesn't render anything
  return null;
}
