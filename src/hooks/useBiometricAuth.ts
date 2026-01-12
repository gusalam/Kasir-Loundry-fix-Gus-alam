import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Biometric Auth types
interface BiometricOptions {
  reason?: string;
  cancelTitle?: string;
  allowDeviceCredential?: boolean;
  iosFallbackTitle?: string;
  androidTitle?: string;
  androidSubtitle?: string;
  androidConfirmationRequired?: boolean;
}

interface CheckBiometryResult {
  isAvailable: boolean;
  biometryType: number;
  reason?: string;
}

// Dynamic import for Capacitor plugin
let BiometricAuth: {
  checkBiometry: () => Promise<CheckBiometryResult>;
  authenticate: (options?: BiometricOptions) => Promise<void>;
} | null = null;

// Initialize plugin dynamically
const initBiometricAuth = async () => {
  if (Capacitor.isNativePlatform() && !BiometricAuth) {
    try {
      const module = await import('@aparajita/capacitor-biometric-auth');
      BiometricAuth = module.BiometricAuth;
    } catch (error) {
      console.log('Biometric auth plugin not available:', error);
    }
  }
};

export type BiometryType = 'none' | 'fingerprint' | 'faceId' | 'iris' | 'unknown';

interface UseBiometricAuthReturn {
  isAvailable: boolean;
  isEnabled: boolean;
  biometryType: BiometryType;
  isNative: boolean;
  checkAvailability: () => Promise<boolean>;
  authenticate: () => Promise<boolean>;
  enableBiometric: (email: string) => void;
  disableBiometric: () => void;
  getSavedCredentials: () => { email: string } | null;
}

const BIOMETRIC_ENABLED_KEY = 'biometric_auth_enabled';
const BIOMETRIC_EMAIL_KEY = 'biometric_auth_email';

export function useBiometricAuth(): UseBiometricAuthReturn {
  const [isAvailable, setIsAvailable] = useState(false);
  const [isEnabled, setIsEnabled] = useState(false);
  const [biometryType, setBiometryType] = useState<BiometryType>('none');
  const isNative = Capacitor.isNativePlatform();

  const getBiometryTypeName = (type: number): BiometryType => {
    switch (type) {
      case 1:
        return 'fingerprint';
      case 2:
        return 'faceId';
      case 3:
        return 'iris';
      default:
        return 'unknown';
    }
  };

  const checkAvailability = useCallback(async (): Promise<boolean> => {
    if (!isNative) {
      setIsAvailable(false);
      return false;
    }

    try {
      await initBiometricAuth();
      
      if (!BiometricAuth) {
        setIsAvailable(false);
        return false;
      }

      const result = await BiometricAuth.checkBiometry();
      setIsAvailable(result.isAvailable);
      
      if (result.isAvailable) {
        setBiometryType(getBiometryTypeName(result.biometryType));
      }
      
      return result.isAvailable;
    } catch (error) {
      console.error('Error checking biometry:', error);
      setIsAvailable(false);
      return false;
    }
  }, [isNative]);

  const authenticate = useCallback(async (): Promise<boolean> => {
    if (!isNative || !BiometricAuth) {
      return false;
    }

    try {
      await BiometricAuth.authenticate({
        reason: 'Verifikasi identitas untuk login',
        cancelTitle: 'Batal',
        allowDeviceCredential: true,
        iosFallbackTitle: 'Gunakan Password',
        androidTitle: 'Login Biometrik',
        androidSubtitle: 'Gunakan sidik jari atau wajah untuk login',
        androidConfirmationRequired: false,
      });
      
      return true;
    } catch (error) {
      console.error('Biometric authentication failed:', error);
      return false;
    }
  }, [isNative]);

  const enableBiometric = useCallback((email: string) => {
    localStorage.setItem(BIOMETRIC_ENABLED_KEY, 'true');
    localStorage.setItem(BIOMETRIC_EMAIL_KEY, email);
    setIsEnabled(true);
  }, []);

  const disableBiometric = useCallback(() => {
    localStorage.removeItem(BIOMETRIC_ENABLED_KEY);
    localStorage.removeItem(BIOMETRIC_EMAIL_KEY);
    setIsEnabled(false);
  }, []);

  const getSavedCredentials = useCallback((): { email: string } | null => {
    const email = localStorage.getItem(BIOMETRIC_EMAIL_KEY);
    if (email) {
      return { email };
    }
    return null;
  }, []);

  useEffect(() => {
    // Check if biometric is enabled in storage
    const enabled = localStorage.getItem(BIOMETRIC_ENABLED_KEY) === 'true';
    setIsEnabled(enabled);

    // Check availability
    checkAvailability();
  }, [checkAvailability]);

  return {
    isAvailable,
    isEnabled,
    biometryType,
    isNative,
    checkAvailability,
    authenticate,
    enableBiometric,
    disableBiometric,
    getSavedCredentials,
  };
}
