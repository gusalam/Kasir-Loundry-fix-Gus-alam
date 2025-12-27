import { supabase } from '@/integrations/supabase/client';

interface CreateNotificationParams {
  userId: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  relatedTable?: string;
  relatedId?: number;
}

export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  try {
    // Use service role via edge function for inserting notifications
    // For now, we'll use client insert with the RLS policy allowing inserts
    const { error } = await supabase.from('notifications').insert({
      user_id: params.userId,
      title: params.title,
      message: params.message,
      type: params.type || 'info',
      related_table: params.relatedTable || null,
      related_id: params.relatedId || null,
    });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error creating notification:', error);
    return false;
  }
}

// Pre-defined notification templates
export const NotificationTemplates = {
  transactionCreated: (invoiceNumber: string) => ({
    title: 'Transaksi Berhasil',
    message: `Transaksi ${invoiceNumber} berhasil dibuat`,
    type: 'success' as const,
  }),
  
  paymentReceived: (invoiceNumber: string, amount: number) => ({
    title: 'Pembayaran Diterima',
    message: `Pembayaran Rp ${amount.toLocaleString('id-ID')} untuk ${invoiceNumber} berhasil`,
    type: 'success' as const,
  }),
  
  laundryReady: (invoiceNumber: string) => ({
    title: 'Laundry Selesai',
    message: `Laundry ${invoiceNumber} sudah selesai dan siap diambil`,
    type: 'info' as const,
  }),
  
  cashClosingSubmitted: (date: string) => ({
    title: 'Tutup Kas Diajukan',
    message: `Tutup kas tanggal ${date} menunggu persetujuan`,
    type: 'warning' as const,
  }),
  
  cashClosingApproved: (date: string) => ({
    title: 'Tutup Kas Disetujui',
    message: `Tutup kas tanggal ${date} telah disetujui`,
    type: 'success' as const,
  }),
  
  expenseRecorded: (description: string, amount: number) => ({
    title: 'Pengeluaran Dicatat',
    message: `${description} - Rp ${amount.toLocaleString('id-ID')}`,
    type: 'info' as const,
  }),
  
  cashDiscrepancy: (difference: number) => ({
    title: 'Selisih Kas Terdeteksi',
    message: `Terdapat selisih kas sebesar Rp ${Math.abs(difference).toLocaleString('id-ID')}`,
    type: 'error' as const,
  }),
};
