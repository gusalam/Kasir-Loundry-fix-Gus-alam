import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';

// Types for Push Notifications
interface PushNotificationToken {
  value: string;
}

interface PushNotificationSchema {
  title?: string;
  subtitle?: string;
  body?: string;
  id: string;
  badge?: number;
  notification?: any;
  data: any;
  click_action?: string;
  link?: string;
}

interface ActionPerformed {
  actionId: string;
  inputValue?: string;
  notification: PushNotificationSchema;
}

interface PermissionStatus {
  receive: 'prompt' | 'prompt-with-rationale' | 'granted' | 'denied';
}

// Dynamic import for Capacitor plugin
let PushNotifications: {
  requestPermissions: () => Promise<PermissionStatus>;
  register: () => Promise<void>;
  getDeliveredNotifications: () => Promise<{ notifications: PushNotificationSchema[] }>;
  removeAllDeliveredNotifications: () => Promise<void>;
  addListener: (eventName: string, listenerFunc: (data: any) => void) => Promise<{ remove: () => Promise<void> }>;
} | null = null;

// Initialize plugin dynamically
const initPushNotifications = async () => {
  if (Capacitor.isNativePlatform() && !PushNotifications) {
    try {
      const module = await import('@capacitor/push-notifications');
      PushNotifications = module.PushNotifications;
    } catch (error) {
      console.log('Push notifications plugin not available:', error);
    }
  }
};

export interface UsePushNotificationsReturn {
  isSupported: boolean;
  isRegistered: boolean;
  token: string | null;
  requestPermission: () => Promise<boolean>;
  registerForPush: () => Promise<string | null>;
}

export function usePushNotifications(
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationTapped?: (action: ActionPerformed) => void
): UsePushNotificationsReturn {
  const [isSupported] = useState(Capacitor.isNativePlatform());
  const [isRegistered, setIsRegistered] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!isSupported) return false;

    try {
      await initPushNotifications();
      if (!PushNotifications) return false;

      const result = await PushNotifications.requestPermissions();
      return result.receive === 'granted';
    } catch (error) {
      console.error('Error requesting push permission:', error);
      return false;
    }
  }, [isSupported]);

  const registerForPush = useCallback(async (): Promise<string | null> => {
    if (!isSupported) return null;

    try {
      await initPushNotifications();
      if (!PushNotifications) return null;

      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        console.log('Push notification permission denied');
        return null;
      }

      await PushNotifications.register();
      return token;
    } catch (error) {
      console.error('Error registering for push:', error);
      return null;
    }
  }, [isSupported, requestPermission, token]);

  useEffect(() => {
    if (!isSupported) return;

    let registrationListener: { remove: () => Promise<void> } | null = null;
    let registrationErrorListener: { remove: () => Promise<void> } | null = null;
    let notificationReceivedListener: { remove: () => Promise<void> } | null = null;
    let notificationActionListener: { remove: () => Promise<void> } | null = null;

    const setupListeners = async () => {
      await initPushNotifications();
      if (!PushNotifications) return;

      // On registration success
      registrationListener = await PushNotifications.addListener(
        'registration',
        (tokenData: PushNotificationToken) => {
          console.log('Push registration success, token:', tokenData.value);
          setToken(tokenData.value);
          setIsRegistered(true);
          
          // Store token for later use (e.g., send to backend)
          localStorage.setItem('push_notification_token', tokenData.value);
        }
      );

      // On registration error
      registrationErrorListener = await PushNotifications.addListener(
        'registrationError',
        (error: any) => {
          console.error('Push registration error:', error);
          setIsRegistered(false);
        }
      );

      // On notification received while app is in foreground
      notificationReceivedListener = await PushNotifications.addListener(
        'pushNotificationReceived',
        (notification: PushNotificationSchema) => {
          console.log('Push notification received:', notification);
          onNotificationReceived?.(notification);
        }
      );

      // On notification tapped
      notificationActionListener = await PushNotifications.addListener(
        'pushNotificationActionPerformed',
        (action: ActionPerformed) => {
          console.log('Push notification action performed:', action);
          onNotificationTapped?.(action);
        }
      );

      // Check if already registered
      const storedToken = localStorage.getItem('push_notification_token');
      if (storedToken) {
        setToken(storedToken);
        setIsRegistered(true);
      }
    };

    setupListeners();

    return () => {
      registrationListener?.remove();
      registrationErrorListener?.remove();
      notificationReceivedListener?.remove();
      notificationActionListener?.remove();
    };
  }, [isSupported, onNotificationReceived, onNotificationTapped]);

  return {
    isSupported,
    isRegistered,
    token,
    requestPermission,
    registerForPush,
  };
}
