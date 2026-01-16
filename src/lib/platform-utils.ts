// Platform detection utilities for Capacitor apps
import { Capacitor } from '@capacitor/core';

export const PlatformUtils = {
  // Check if running in native app (Android/iOS)
  isNative(): boolean {
    return Capacitor.isNativePlatform();
  },

  // Check if running on Android
  isAndroid(): boolean {
    return Capacitor.getPlatform() === 'android';
  },

  // Check if running on iOS
  isIOS(): boolean {
    return Capacitor.getPlatform() === 'ios';
  },

  // Check if running in web browser
  isWeb(): boolean {
    return Capacitor.getPlatform() === 'web';
  },

  // Get current platform name
  getPlatform(): 'android' | 'ios' | 'web' {
    return Capacitor.getPlatform() as 'android' | 'ios' | 'web';
  },

  // Check if feature is available on current platform
  isFeatureAvailable(feature: 'bluetooth' | 'camera' | 'push'): boolean {
    if (feature === 'bluetooth') {
      // Bluetooth native API only on Android
      return this.isAndroid();
    }
    
    if (feature === 'camera') {
      // Camera works on all platforms
      return true;
    }
    
    if (feature === 'push') {
      // Push notifications on native platforms
      return this.isNative();
    }
    
    return false;
  },
};
