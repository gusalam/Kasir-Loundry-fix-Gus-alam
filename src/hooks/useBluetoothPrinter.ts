import { useState, useEffect, useCallback } from 'react';
import { bluetoothPrinter } from '@/lib/bluetooth-printer';

interface PrinterStatus {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
}

export function useBluetoothPrinter() {
  const [status, setStatus] = useState<PrinterStatus>({
    isSupported: false,
    isConnected: false,
    deviceName: null,
    isConnecting: false,
    error: null,
  });

  // Check if supported on mount
  useEffect(() => {
    setStatus(prev => ({
      ...prev,
      isSupported: bluetoothPrinter.isSupported(),
      isConnected: bluetoothPrinter.isConnected(),
      deviceName: bluetoothPrinter.getConnectedDeviceName(),
    }));
  }, []);

  // Connect to printer
  const connect = useCallback(async () => {
    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    const result = await bluetoothPrinter.connect();

    setStatus(prev => ({
      ...prev,
      isConnecting: false,
      isConnected: result.success,
      deviceName: result.deviceName || null,
      error: result.error || null,
    }));

    return result;
  }, []);

  // Disconnect from printer
  const disconnect = useCallback(async () => {
    await bluetoothPrinter.disconnect();
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
  }, []);

  // Print receipt
  const printReceipt = useCallback(async (receiptData: Parameters<typeof bluetoothPrinter.printReceipt>[0]) => {
    if (!status.isConnected) {
      return { success: false, error: 'Printer tidak terhubung' };
    }
    return bluetoothPrinter.printReceipt(receiptData);
  }, [status.isConnected]);

  // Print test page
  const printTestPage = useCallback(async () => {
    if (!status.isConnected) {
      return { success: false, error: 'Printer tidak terhubung' };
    }
    return bluetoothPrinter.printTestPage();
  }, [status.isConnected]);

  return {
    status,
    connect,
    disconnect,
    printReceipt,
    printTestPage,
  };
}
