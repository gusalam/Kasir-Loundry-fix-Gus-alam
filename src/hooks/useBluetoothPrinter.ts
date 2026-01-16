import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { capacitorBluetoothPrinter, BluetoothDevice } from '@/lib/capacitor-bluetooth-printer';

// Web Bluetooth fallback (for development/testing in Chrome)
import { bluetoothPrinter as webBluetoothPrinter } from '@/lib/bluetooth-printer';

interface PrinterStatus {
  isSupported: boolean;
  isConnected: boolean;
  deviceName: string | null;
  isConnecting: boolean;
  error: string | null;
  platform: 'native' | 'web';
}

export function useBluetoothPrinter() {
  const isNative = Capacitor.isNativePlatform();
  
  const [status, setStatus] = useState<PrinterStatus>({
    isSupported: false,
    isConnected: false,
    deviceName: null,
    isConnecting: false,
    error: null,
    platform: isNative ? 'native' : 'web',
  });
  
  const [availableDevices, setAvailableDevices] = useState<BluetoothDevice[]>([]);

  // Check if supported on mount
  useEffect(() => {
    if (isNative) {
      // Native Android - always supported
      const savedPrinter = capacitorBluetoothPrinter.getSavedPrinter();
      setStatus(prev => ({
        ...prev,
        isSupported: true,
        isConnected: capacitorBluetoothPrinter.isConnected(),
        deviceName: savedPrinter?.name || null,
        platform: 'native',
      }));
    } else {
      // Web - check Web Bluetooth API
      setStatus(prev => ({
        ...prev,
        isSupported: webBluetoothPrinter.isSupported(),
        isConnected: webBluetoothPrinter.isConnected(),
        deviceName: webBluetoothPrinter.getConnectedDeviceName(),
        platform: 'web',
      }));
    }
  }, [isNative]);

  // Scan for available devices (native only)
  const scanDevices = useCallback(async () => {
    if (!isNative) {
      return { success: false, devices: [], error: 'Scan hanya tersedia di aplikasi Android' };
    }
    
    setStatus(prev => ({ ...prev, error: null }));
    
    const result = await capacitorBluetoothPrinter.listDevices();
    
    if (result.success && result.devices) {
      setAvailableDevices(result.devices);
    } else {
      setStatus(prev => ({ ...prev, error: result.error || 'Gagal mencari perangkat' }));
    }
    
    return result;
  }, [isNative]);

  // Connect to printer
  const connect = useCallback(async (address?: string) => {
    setStatus(prev => ({ ...prev, isConnecting: true, error: null }));

    let result: { success: boolean; deviceName?: string; error?: string };

    if (isNative) {
      result = await capacitorBluetoothPrinter.connect(address);
    } else {
      result = await webBluetoothPrinter.connect();
    }

    setStatus(prev => ({
      ...prev,
      isConnecting: false,
      isConnected: result.success,
      deviceName: result.deviceName || null,
      error: result.error || null,
    }));

    return result;
  }, [isNative]);

  // Disconnect from printer
  const disconnect = useCallback(async () => {
    if (isNative) {
      await capacitorBluetoothPrinter.disconnect();
    } else {
      await webBluetoothPrinter.disconnect();
    }
    
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
  }, [isNative]);

  // Print receipt
  const printReceipt = useCallback(async (receiptData: Parameters<typeof capacitorBluetoothPrinter.printReceipt>[0]) => {
    let result: { success: boolean; error?: string };

    if (isNative) {
      result = await capacitorBluetoothPrinter.printReceipt(receiptData);
      
      // Update connection status
      setStatus(prev => ({
        ...prev,
        isConnected: capacitorBluetoothPrinter.isConnected(),
        deviceName: capacitorBluetoothPrinter.getConnectedDeviceName(),
      }));
    } else {
      if (!webBluetoothPrinter.isConnected()) {
        return { success: false, error: 'Printer tidak terhubung' };
      }
      result = await webBluetoothPrinter.printReceipt(receiptData);
    }
    
    return result;
  }, [isNative]);

  // Print test page
  const printTestPage = useCallback(async () => {
    let result: { success: boolean; error?: string };

    if (isNative) {
      result = await capacitorBluetoothPrinter.printTestPage();
      
      // Update connection status
      setStatus(prev => ({
        ...prev,
        isConnected: capacitorBluetoothPrinter.isConnected(),
        deviceName: capacitorBluetoothPrinter.getConnectedDeviceName(),
      }));
    } else {
      if (!webBluetoothPrinter.isConnected()) {
        return { success: false, error: 'Printer tidak terhubung' };
      }
      result = await webBluetoothPrinter.printTestPage();
    }
    
    return result;
  }, [isNative]);

  // Forget saved printer (native only)
  const forgetPrinter = useCallback(() => {
    if (isNative) {
      capacitorBluetoothPrinter.removeSavedPrinter();
    }
    setStatus(prev => ({
      ...prev,
      isConnected: false,
      deviceName: null,
    }));
  }, [isNative]);

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
