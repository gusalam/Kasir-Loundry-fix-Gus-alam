import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { offlineStorage, OfflineTransaction } from '@/lib/offline-storage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface SyncStatus {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  lastSyncTime: Date | null;
  syncErrors: string[];
}

export function useOfflineSync() {
  const { user } = useAuth();
  const [syncStatus, setSyncStatus] = useState<SyncStatus>({
    isOnline: navigator.onLine,
    isSyncing: false,
    pendingCount: 0,
    lastSyncTime: null,
    syncErrors: [],
  });

  // Initialize offline storage
  useEffect(() => {
    offlineStorage.init().catch(console.error);
  }, []);

  // Update pending count
  const updatePendingCount = useCallback(async () => {
    try {
      const pending = await offlineStorage.getPendingTransactions();
      setSyncStatus(prev => ({ ...prev, pendingCount: pending.length }));
    } catch (error) {
      console.error('Error getting pending count:', error);
    }
  }, []);

  // Listen for online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: true }));
      // Trigger sync when coming back online
      syncPendingTransactions();
    };

    const handleOffline = () => {
      setSyncStatus(prev => ({ ...prev, isOnline: false }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial check
    updatePendingCount();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [updatePendingCount]);

  // Cache data for offline use
  const cacheDataForOffline = useCallback(async () => {
    if (!navigator.onLine) return;

    try {
      // Cache services
      const { data: services } = await supabase
        .from('services')
        .select('id, name, price, type, is_active')
        .eq('is_active', true);

      if (services) {
        await offlineStorage.cacheServices(services);
      }

      // Cache customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, phone, address')
        .order('name');

      if (customers) {
        await offlineStorage.cacheCustomers(customers);
      }

      console.log('Data cached for offline use');
    } catch (error) {
      console.error('Error caching data:', error);
    }
  }, []);

  // Sync pending transactions
  const syncPendingTransactions = useCallback(async () => {
    if (!navigator.onLine || !user) return;

    setSyncStatus(prev => ({ ...prev, isSyncing: true, syncErrors: [] }));
    const errors: string[] = [];

    try {
      const pending = await offlineStorage.getPendingTransactions();

      for (const offlineTx of pending) {
        try {
          // Create customer if needed (new customer)
          let customerId = offlineTx.data.customer_id;

          if (!customerId && offlineTx.data.customer_name) {
            // Check if customer exists
            const { data: existingCustomer } = await supabase
              .from('customers')
              .select('id')
              .eq('name', offlineTx.data.customer_name)
              .maybeSingle();

            if (existingCustomer) {
              customerId = existingCustomer.id;
            } else {
              // Create new customer
              const { data: newCustomer, error: custError } = await supabase
                .from('customers')
                .insert({ name: offlineTx.data.customer_name })
                .select('id')
                .single();

              if (custError) throw custError;
              customerId = newCustomer.id;
            }
          }

          // Create transaction
          const { data: transaction, error: txError } = await supabase
            .from('transactions')
            .insert({
              customer_id: customerId,
              user_id: user.id,
              total_amount: offlineTx.data.total_amount,
              paid_amount: offlineTx.data.paid_amount,
              payment_status: offlineTx.data.payment_status as any,
              notes: offlineTx.data.notes,
              estimated_date: offlineTx.data.estimated_date,
              invoice_number: `OFFLINE-${offlineTx.id}`, // Temporary, will be replaced by trigger
            })
            .select('id')
            .single();

          if (txError) throw txError;

          // Create transaction items
          const items = offlineTx.data.items.map(item => ({
            transaction_id: transaction.id,
            service_id: item.service_id,
            service_name: item.service_name,
            qty: item.qty,
            price: item.price,
            subtotal: item.subtotal,
          }));

          const { error: itemsError } = await supabase
            .from('transaction_items')
            .insert(items);

          if (itemsError) throw itemsError;

          // Create payment if paid
          if (offlineTx.data.paid_amount > 0) {
            const { error: paymentError } = await supabase
              .from('payments')
              .insert({
                transaction_id: transaction.id,
                amount: offlineTx.data.paid_amount,
                method: offlineTx.data.payment_method as any,
                received_by: user.id,
              });

            if (paymentError) throw paymentError;
          }

          // Mark as synced
          await offlineStorage.markTransactionSynced(offlineTx.id);
          console.log(`Transaction ${offlineTx.id} synced successfully`);

        } catch (error: any) {
          const errorMsg = `Failed to sync transaction ${offlineTx.id}: ${error.message}`;
          errors.push(errorMsg);
          await offlineStorage.markTransactionError(offlineTx.id, error.message);
          console.error(errorMsg);
        }
      }

      // Clean up synced transactions
      await offlineStorage.clearSyncedTransactions();

      // Update status
      await updatePendingCount();
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        lastSyncTime: new Date(),
        syncErrors: errors,
      }));

      if (pending.length > 0 && errors.length === 0) {
        toast.success(`${pending.length} transaksi berhasil disinkronkan`);
      } else if (errors.length > 0) {
        toast.error(`${errors.length} transaksi gagal disinkronkan`);
      }

    } catch (error: any) {
      console.error('Sync error:', error);
      setSyncStatus(prev => ({
        ...prev,
        isSyncing: false,
        syncErrors: [error.message],
      }));
    }
  }, [user, updatePendingCount]);

  // Save transaction offline
  const saveTransactionOffline = useCallback(async (
    transactionData: OfflineTransaction['data']
  ): Promise<{ success: boolean; offlineId?: string; error?: string }> => {
    try {
      const offlineId = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      await offlineStorage.addPendingTransaction({
        id: offlineId,
        data: transactionData,
        created_at: new Date().toISOString(),
      });

      await updatePendingCount();
      
      return { success: true, offlineId };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }, [updatePendingCount]);

  // Get cached data
  const getCachedServices = useCallback(async () => {
    return offlineStorage.getCachedServices();
  }, []);

  const getCachedCustomers = useCallback(async () => {
    return offlineStorage.getCachedCustomers();
  }, []);

  const searchCachedCustomers = useCallback(async (query: string) => {
    return offlineStorage.searchCachedCustomers(query);
  }, []);

  return {
    syncStatus,
    cacheDataForOffline,
    syncPendingTransactions,
    saveTransactionOffline,
    getCachedServices,
    getCachedCustomers,
    searchCachedCustomers,
    updatePendingCount,
  };
}
