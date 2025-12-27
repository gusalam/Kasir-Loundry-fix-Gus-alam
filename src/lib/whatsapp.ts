import { supabase } from '@/integrations/supabase/client';

interface SendWhatsAppParams {
  to: string;
  templateType: 'transaction_created' | 'payment_received' | 'laundry_ready';
  data: {
    invoiceNumber?: string;
    businessName?: string;
    totalAmount?: number;
    paidAmount?: number;
    paymentStatus?: string;
    customerName?: string;
  };
}

export async function sendWhatsAppNotification(params: SendWhatsAppParams): Promise<{ success: boolean; message?: string }> {
  // Don't send if no phone number
  if (!params.to || params.to.trim() === '') {
    console.log('No phone number provided, skipping WhatsApp notification');
    return { success: false, message: 'No phone number provided' };
  }

  try {
    const { data, error } = await supabase.functions.invoke('send-whatsapp', {
      body: params,
    });

    if (error) {
      console.error('Error calling send-whatsapp function:', error);
      return { success: false, message: error.message };
    }

    if (data?.skipped) {
      console.log('WhatsApp notification skipped:', data.message);
      return { success: false, message: data.message };
    }

    return { success: data?.success || false, message: data?.message };
  } catch (error) {
    console.error('Error sending WhatsApp notification:', error);
    return { success: false, message: 'Failed to send WhatsApp notification' };
  }
}

// Helper to check if WhatsApp is enabled in settings
export async function isWhatsAppEnabled(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('receipt_settings')
      .select('whatsapp_enabled')
      .eq('user_id', userId)
      .maybeSingle();

    if (error || !data) return false;
    return data.whatsapp_enabled === true;
  } catch {
    return false;
  }
}
