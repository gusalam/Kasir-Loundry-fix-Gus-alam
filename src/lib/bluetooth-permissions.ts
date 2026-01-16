// Bluetooth Permission Handler for Android (Capacitor)
// Handles runtime permission requests for Bluetooth on Android 12+

import { Capacitor } from '@capacitor/core';

// Permission status types
export type PermissionStatus = 'granted' | 'denied' | 'prompt' | 'unavailable';

export interface BluetoothPermissionResult {
  granted: boolean;
  status: PermissionStatus;
  message?: string;
}

// Android Bluetooth permissions needed
const ANDROID_PERMISSIONS = {
  BLUETOOTH: 'android.permission.BLUETOOTH',
  BLUETOOTH_ADMIN: 'android.permission.BLUETOOTH_ADMIN',
  BLUETOOTH_CONNECT: 'android.permission.BLUETOOTH_CONNECT',
  BLUETOOTH_SCAN: 'android.permission.BLUETOOTH_SCAN',
  ACCESS_FINE_LOCATION: 'android.permission.ACCESS_FINE_LOCATION',
};

class BluetoothPermissionHandler {
  private permissionsPlugin: any = null;

  // Check if running on Android
  isAndroid(): boolean {
    return Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android';
  }

  // Lazy-load Android Permissions plugin
  private async getPermissionsPlugin(): Promise<any> {
    if (!this.isAndroid()) return null;

    if (this.permissionsPlugin) return this.permissionsPlugin;

    try {
      // For basic permission handling, we'll handle through the Bluetooth plugin itself
      // which triggers Android's permission dialogs automatically
      return null; // Bluetooth plugin handles permissions internally
    } catch (error) {
      console.error('Failed to load permissions plugin:', error);
      return null;
    }
  }

  // Check Bluetooth permission status
  async checkBluetoothPermission(): Promise<BluetoothPermissionResult> {
    if (!this.isAndroid()) {
      return { granted: true, status: 'granted' };
    }

    try {
      // For Android, we'll try to access Bluetooth and catch permission errors
      // The actual permission request happens through the Bluetooth plugin
      const plugin = await this.getBluetoothPlugin();
      if (!plugin) {
        return { granted: false, status: 'unavailable', message: 'Plugin Bluetooth tidak tersedia' };
      }

      // Try to list devices - this will trigger permission request on Android
      try {
        await plugin.list();
        return { granted: true, status: 'granted' };
      } catch (error: any) {
        if (error.message?.includes('permission')) {
          return { granted: false, status: 'denied', message: 'Izin Bluetooth ditolak' };
        }
        // Other errors might still mean permissions are OK
        return { granted: true, status: 'granted' };
      }
    } catch (error) {
      console.error('Permission check error:', error);
      return { granted: false, status: 'unavailable', message: 'Gagal memeriksa izin' };
    }
  }

  // Request Bluetooth permissions
  async requestBluetoothPermission(): Promise<BluetoothPermissionResult> {
    if (!this.isAndroid()) {
      return { granted: true, status: 'granted' };
    }

    try {
      const plugin = await this.getBluetoothPlugin();
      if (!plugin) {
        return { 
          granted: false, 
          status: 'unavailable', 
          message: 'Plugin Bluetooth tidak tersedia. Pastikan aplikasi terinstall dengan benar.' 
        };
      }

      // The Bluetooth plugin will automatically trigger Android's permission dialog
      // when we try to scan/connect
      try {
        const result = await plugin.list();
        return { granted: true, status: 'granted' };
      } catch (error: any) {
        const errorMessage = error.message || '';
        
        if (errorMessage.includes('permission') || errorMessage.includes('denied')) {
          return { 
            granted: false, 
            status: 'denied', 
            message: 'Izin Bluetooth diperlukan untuk menghubungkan printer. Silakan berikan izin melalui Pengaturan > Aplikasi > Izin.' 
          };
        }
        
        if (errorMessage.includes('bluetooth') && errorMessage.includes('off')) {
          return { 
            granted: false, 
            status: 'denied', 
            message: 'Bluetooth tidak aktif. Silakan aktifkan Bluetooth di pengaturan.' 
          };
        }

        // Generic error
        return { 
          granted: false, 
          status: 'denied', 
          message: `Gagal mengakses Bluetooth: ${errorMessage}` 
        };
      }
    } catch (error: any) {
      console.error('Permission request error:', error);
      return { 
        granted: false, 
        status: 'unavailable', 
        message: 'Terjadi kesalahan saat meminta izin Bluetooth' 
      };
    }
  }

  // Get Bluetooth plugin
  private async getBluetoothPlugin(): Promise<any> {
    try {
      const module = await import('@kduma-autoid/capacitor-bluetooth-printer');
      return module.BluetoothPrinter;
    } catch (error) {
      console.error('Failed to load Bluetooth plugin:', error);
      return null;
    }
  }

  // Open app settings (for when permission is permanently denied)
  async openAppSettings(): Promise<void> {
    if (!this.isAndroid()) return;

    try {
      const { App } = await import('@capacitor/app');
      // Note: Capacitor App plugin doesn't have openSettings, so we'll guide users manually
      console.log('Guide user to open settings manually');
    } catch (error) {
      console.error('Failed to open settings:', error);
    }
  }
}

export const bluetoothPermissions = new BluetoothPermissionHandler();
