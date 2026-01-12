import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PushNotificationSchema {
  title?: string;
  subtitle?: string;
  body?: string;
  id: string;
  data: any;
}

interface ActionPerformed {
  actionId: string;
  notification: PushNotificationSchema;
}

export function PushNotificationManager() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  const handleNotificationReceived = useCallback((notification: PushNotificationSchema) => {
    // Show toast for foreground notifications
    toast.info(notification.title || 'Notifikasi Baru', {
      description: notification.body,
      action: notification.data?.transactionId ? {
        label: 'Lihat',
        onClick: () => {
          navigate('/kasir/transactions');
        },
      } : undefined,
    });
  }, [navigate]);

  const handleNotificationTapped = useCallback((action: ActionPerformed) => {
    // Navigate based on notification data
    const data = action.notification.data;
    
    if (data?.type === 'new_transaction' && data?.transactionId) {
      navigate('/kasir/transactions');
    } else if (data?.type === 'pickup_ready') {
      navigate('/kasir/pickup');
    } else {
      // Default navigation
      navigate('/kasir/dashboard');
    }
  }, [navigate]);

  const { isSupported, isRegistered, token, registerForPush } = usePushNotifications(
    handleNotificationReceived,
    handleNotificationTapped
  );

  // Register for push notifications when user logs in
  useEffect(() => {
    if (isAuthenticated && isSupported && !isRegistered) {
      registerForPush();
    }
  }, [isAuthenticated, isSupported, isRegistered, registerForPush]);

  // Store push token in database when available
  useEffect(() => {
    const storePushToken = async () => {
      if (token && user?.id) {
        try {
          // You can store the token in a push_tokens table if needed
          // For now, we'll just log it
          console.log('Push token for user', user.id, ':', token);
          
          // Optionally store in localStorage for reference
          localStorage.setItem('user_push_token', JSON.stringify({
            userId: user.id,
            token: token,
            updatedAt: new Date().toISOString(),
          }));
        } catch (error) {
          console.error('Error storing push token:', error);
        }
      }
    };

    storePushToken();
  }, [token, user?.id]);

  // This component doesn't render anything visible
  return null;
}
