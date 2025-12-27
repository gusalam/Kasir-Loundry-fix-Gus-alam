import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface WhatsAppRequest {
  to: string; // Phone number with country code (e.g., +6281234567890)
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

// Check if Twilio credentials are configured
function isTwilioConfigured(): boolean {
  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM');
  
  return !!(accountSid && authToken && fromNumber && 
    accountSid !== 'YOUR_ACCOUNT_SID' && 
    authToken !== 'YOUR_AUTH_TOKEN' &&
    fromNumber !== 'YOUR_WHATSAPP_NUMBER');
}

// Format phone number for WhatsApp
function formatWhatsAppNumber(phone: string): string {
  // Remove all non-digit characters
  let cleaned = phone.replace(/\D/g, '');
  
  // If starts with 0, replace with 62 (Indonesia)
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  }
  
  // Ensure it starts with country code
  if (!cleaned.startsWith('62')) {
    cleaned = '62' + cleaned;
  }
  
  return `whatsapp:+${cleaned}`;
}

// Generate message based on template type
function generateMessage(templateType: string, data: WhatsAppRequest['data']): string {
  const businessName = data.businessName || 'POS Laundry';
  
  switch (templateType) {
    case 'transaction_created':
      return `🧺 *${businessName}*

Halo ${data.customerName || 'Pelanggan'}! 👋

Terima kasih telah mempercayakan laundry Anda kepada kami.

📋 *Detail Order:*
No. Invoice: ${data.invoiceNumber}
Total: Rp ${data.totalAmount?.toLocaleString('id-ID') || 0}

Laundry Anda sedang kami proses dengan penuh perhatian. Kami akan menginformasikan saat laundry selesai.

💙 Terima kasih atas kepercayaan Anda!`;

    case 'payment_received':
      const statusText = data.paymentStatus === 'lunas' ? 'LUNAS ✅' : 'DP';
      return `💰 *${businessName}*

Pembayaran Diterima!

📋 *Detail Pembayaran:*
No. Invoice: ${data.invoiceNumber}
Nominal: Rp ${data.paidAmount?.toLocaleString('id-ID') || 0}
Status: ${statusText}

${data.paymentStatus === 'lunas' 
  ? '✨ Terima kasih! Pembayaran Anda telah lunas.' 
  : '📝 Sisa pembayaran dapat dilunasi saat pengambilan.'}

💙 Kami menghargai kepercayaan Anda!`;

    case 'laundry_ready':
      return `✨ *${businessName}*

Kabar Baik! 🎉

Laundry Anda sudah *SELESAI* dan siap diambil!

📋 No. Invoice: ${data.invoiceNumber}

Silakan datang ke outlet kami untuk mengambil laundry Anda.

⏰ Jam Operasional:
Senin - Sabtu: 08:00 - 21:00
Minggu: 09:00 - 18:00

💙 Terima kasih telah memilih kami!`;

    default:
      return `Pesan dari ${businessName}`;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Check if Twilio is configured
    if (!isTwilioConfigured()) {
      console.log('Twilio credentials not configured. WhatsApp notification skipped.');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'WhatsApp notifications not configured. Please add Twilio credentials.',
          skipped: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const { to, templateType, data }: WhatsAppRequest = await req.json();

    // Validate phone number
    if (!to || to.trim() === '') {
      console.log('No phone number provided. WhatsApp notification skipped.');
      return new Response(
        JSON.stringify({ 
          success: false, 
          message: 'No phone number provided',
          skipped: true 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID')!;
    const authToken = Deno.env.get('TWILIO_AUTH_TOKEN')!;
    const fromNumber = Deno.env.get('TWILIO_WHATSAPP_FROM')!;

    const toWhatsApp = formatWhatsAppNumber(to);
    const fromWhatsApp = `whatsapp:${fromNumber}`;
    const message = generateMessage(templateType, data);

    console.log(`Sending WhatsApp to ${toWhatsApp}`);

    // Send via Twilio API
    const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;
    
    const response = await fetch(twilioUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa(`${accountSid}:${authToken}`),
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        From: fromWhatsApp,
        To: toWhatsApp,
        Body: message,
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      console.error('Twilio error:', result);
      return new Response(
        JSON.stringify({ success: false, error: result.message || 'Failed to send WhatsApp' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log('WhatsApp sent successfully:', result.sid);

    return new Response(
      JSON.stringify({ success: true, messageSid: result.sid }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-whatsapp function:', error);
    return new Response(
      JSON.stringify({ success: false, error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
