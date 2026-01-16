import { useState, useEffect, useCallback } from 'react';
import { capacitorBluetoothPrinter, BluetoothDevice } from '@/lib/capacitor-bluetooth-printer';

interface PrinterStatus {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
  isNative: boolean;
}

export function useNativeBluetoothPrinter() {
  const [status, setStatus] = useState<PrinterStatus>({
    isSupported: false,
    isConnected: false,
    deviceName: null,
    isConnecting: false,
    error: null,
    isNative: false,
  });
  
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);

  // Check if supported on mount
  useEffect(() => {
    const savedPrinter = capacitorBluetoothPrinter.getSavedPrinter();
    
    setStatus(prev => ({
      ...prev,
      isSupported: capacitorBluetoothPrinter.isSupported(),
      isConnected: capacitorBluetoothPrinter.isConnected(),
      deviceName: capacitorBluetoothPrinter.getConnectedDeviceName() || savedPrinter?.name || null,
      isNative: capacitorBluetoothPrinter.isNativePlatform(),
    }));
  }, []);

  // Scan for available devices
  const scanDevices = useCallback(async () => {
    setStatus(prev => ({ ...prev, error: null }));
    
    const result = await capacitorBluetoothPrinter.listDevices();
    
    if (result.success && result.devices) {
      setAvailableDevices(result.devices);
    } else {
      setStatus(prev => ({ ...prev, error: result.error || 'Gagal mencari perangkat' }));
    }
    
    return result;
  }, []);

  // Connect to printer
  const connect = useCallback(async (address?: string) => {
    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    const result = await capacitorBluetoothPrinter.connect(address);

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
    await capacitorBluetoothPrinter.disconnect();
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
  }, []);

  // Print receipt
  const printReceipt = useCallback(async (receiptData: Parameters<typeof capacitorBluetoothPrinter.printReceipt>[0]) => {
    const result = await capacitorBluetoothPrinter.printReceipt(receiptData);
    
    // Update connection status after print attempt
    setStatus(prev => ({
      ...prev,
      isConnected: capacitorBluetoothPrinter.isConnected(),
      deviceName: capacitorBluetoothPrinter.getConnectedDeviceName(),
    }));
    
    return result;
  }, []);

  // Print test page
  const printTestPage = useCallback(async () => {
    const result = await capacitorBluetoothPrinter.printTestPage();
    
    // Update connection status after print attempt
    setStatus(prev => ({
      ...prev,
      isConnected: capacitorBluetoothPrinter.isConnected(),
      deviceName: capacitorBluetoothPrinter.getConnectedDeviceName(),
    }));
    
    return result;
  }, []);

  // Forget saved printer
  const forgetPrinter = useCallback(() => {
    capacitorBluetoothPrinter.removeSavedPrinter();
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
  }, []);

  return {
    status,
    availableDevices,
    scanDevices,
    connect,
    disconnect,
    printReceipt,
    printTestPage,
    forgetPrinter,
  };
}
