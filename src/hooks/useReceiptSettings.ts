import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface ReceiptSettingsData {
  id?: number;
  user_id: string;
  business_name: string;
  address: string | null;
  phone: string | null;
  footer_text: string | null;
  show_logo: boolean;
  paper_size: string;
  whatsapp_enabled: boolean;
}

const DEFAULT_SETTINGS: Omit<ReceiptSettingsData, 'user_id'> = {
  business_name: 'POS Laundry',
  address: 'Jl. Contoh No. 123',
  phone: '08123456789',
  footer_text: 'Terima kasih atas kepercayaan Anda!',
  show_logo: true,
  paper_size: '58mm',
  whatsapp_enabled: false,
};

export function useReceiptSettings() {
  const { user } = useAuth();
  const [settings, setSettings] = useState<ReceiptSettingsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchSettings();
    } else {
      setIsLoading(false);
    }
  }, [user?.id]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('receipt-settings-hook')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'receipt_settings',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('Receipt settings updated via realtime:', payload);
          if (payload.new && typeof payload.new === 'object') {
            setSettings(payload.new as ReceiptSettingsData);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  const fetchSettings = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings(data);
      } else {
        // Return defaults with user_id
        setSettings({
          ...DEFAULT_SETTINGS,
          user_id: user.id,
        });
      }
    } catch (error) {
      console.error('Error fetching receipt settings:', error);
      // Use defaults on error
      setSettings({
        ...DEFAULT_SETTINGS,
        user_id: user?.id || '',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const getReceiptProps = () => ({
    laundryName: settings?.business_name || DEFAULT_SETTINGS.business_name,
    laundryAddress: settings?.address || DEFAULT_SETTINGS.address || '',
    laundryPhone: settings?.phone || DEFAULT_SETTINGS.phone || '',
    footerText: settings?.footer_text || DEFAULT_SETTINGS.footer_text || '',
    showLogo: settings?.show_logo ?? DEFAULT_SETTINGS.show_logo,
    paperSize: settings?.paper_size || DEFAULT_SETTINGS.paper_size,
  });

  return {
    settings,
    isLoading,
    refetch: fetchSettings,
    getReceiptProps,
  };
}
