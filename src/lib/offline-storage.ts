// Offline Storage Service using IndexedDB
import { openDB, IDBPDatabase } from 'idb';
import type { DBSchema } from 'idb';

interface OfflineTransaction {
  id: string;
  data: {
    customer_id: number | null;
    customer_name: string;
    items: Array<{
      service_id: number;
      service_name: string;
      qty: number;
      price: number;
      subtotal: number;
    }>;
    total_amount: number;
    paid_amount: number;
    payment_method: string;
    payment_status: string;
    notes?: string;
    estimated_date?: string;
  };
  created_at: string;
  synced: boolean;
  sync_error?: string;
}

interface CachedService {
  id: number;
  name: string;
  price: number;
  type: string;
  is_active: boolean;
}

interface CachedCustomer {
  id: number;
  name: string;
  phone: string | null;
  address: string | null;
}

// Simple schema without extends
type OfflineDBSchema = {
  'pending-transactions': {
    key: string;
    value: OfflineTransaction;
    indexes: { 'by-synced': boolean };
  };
  'cached-services': {
    key: number;
    value: CachedService;
  };
  'cached-customers': {
    key: number;
    value: CachedCustomer;
    indexes: { 'by-name': string };
  };
  'sync-queue': {
    key: string;
    value: {
      id: string;
      type: 'transaction' | 'customer';
      action: 'create' | 'update';
      data: any;
      created_at: string;
      attempts: number;
      last_error?: string;
    };
  };
};

// SyncQueue value type
interface SyncQueueItem {
  id: string;
  type: 'transaction' | 'customer';
  action: 'create' | 'update';
  data: any;
  created_at: string;
  attempts: number;
  last_error?: string;
}

class OfflineStorageService {
  private db: IDBPDatabase<any> | null = null;
  private dbName = 'kasir-laundry-offline';
  private dbVersion = 1;

  async init(): Promise<void> {
    if (this.db) return;

    this.db = await openDB(this.dbName, this.dbVersion, {
      upgrade(db: any) {
        // Pending transactions store
        if (!db.objectStoreNames.contains('pending-transactions')) {
          const txStore = db.createObjectStore('pending-transactions', { keyPath: 'id' });
          txStore.createIndex('by-synced', 'synced');
        }

        // Cached services store
        if (!db.objectStoreNames.contains('cached-services')) {
          db.createObjectStore('cached-services', { keyPath: 'id' });
        }

        // Cached customers store
        if (!db.objectStoreNames.contains('cached-customers')) {
          const custStore = db.createObjectStore('cached-customers', { keyPath: 'id' });
          custStore.createIndex('by-name', 'name');
        }

        // Sync queue store
        if (!db.objectStoreNames.contains('sync-queue')) {
          db.createObjectStore('sync-queue', { keyPath: 'id' });
        }
      },
    });
  }

  // Check if initialized
  private ensureDB(): IDBPDatabase<any> {
    if (!this.db) {
      throw new Error('Database not initialized. Call init() first.');
    }
    return this.db;
  }

  // ============ SERVICES CACHE ============

  async cacheServices(services: CachedService[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('cached-services', 'readwrite');
    await tx.store.clear();
    for (const service of services) {
      await tx.store.put(service);
    }
    await tx.done;
  }

  async getCachedServices(): Promise<CachedService[]> {
    const db = this.ensureDB();
    return db.getAll('cached-services');
  }

  // ============ CUSTOMERS CACHE ============

  async cacheCustomers(customers: CachedCustomer[]): Promise<void> {
    const db = this.ensureDB();
    const tx = db.transaction('cached-customers', 'readwrite');
    await tx.store.clear();
    for (const customer of customers) {
      await tx.store.put(customer);
    }
    await tx.done;
  }

  async getCachedCustomers(): Promise<CachedCustomer[]> {
    const db = this.ensureDB();
    return db.getAll('cached-customers');
  }

  async addCachedCustomer(customer: CachedCustomer): Promise<void> {
    const db = this.ensureDB();
    await db.put('cached-customers', customer);
  }

  async searchCachedCustomers(query: string): Promise<CachedCustomer[]> {
    const customers = await this.getCachedCustomers();
    const lowerQuery = query.toLowerCase();
    return customers.filter(
      c => c.name.toLowerCase().includes(lowerQuery) || 
           c.phone?.includes(query)
    );
  }

  // ============ PENDING TRANSACTIONS ============

  async addPendingTransaction(transaction: Omit<OfflineTransaction, 'synced'>): Promise<void> {
    const db = this.ensureDB();
    await db.put('pending-transactions', {
      ...transaction,
      synced: false,
    });
  }

  async getPendingTransactions(): Promise<OfflineTransaction[]> {
    const db = this.ensureDB();
    return db.getAllFromIndex('pending-transactions', 'by-synced', false);
  }

  async getAllPendingTransactions(): Promise<OfflineTransaction[]> {
    const db = this.ensureDB();
    return db.getAll('pending-transactions');
  }

  async markTransactionSynced(id: string): Promise<void> {
    const db = this.ensureDB();
    const tx = await db.get('pending-transactions', id);
    if (tx) {
      tx.synced = true;
      await db.put('pending-transactions', tx);
    }
  }

  async markTransactionError(id: string, error: string): Promise<void> {
    const db = this.ensureDB();
    const tx = await db.get('pending-transactions', id);
    if (tx) {
      tx.sync_error = error;
      await db.put('pending-transactions', tx);
    }
  }

  async removePendingTransaction(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('pending-transactions', id);
  }

  async clearSyncedTransactions(): Promise<void> {
    const db = this.ensureDB();
    const all = await db.getAll('pending-transactions');
    const tx = db.transaction('pending-transactions', 'readwrite');
    for (const item of all) {
      if (item.synced) {
        await tx.store.delete(item.id);
      }
    }
    await tx.done;
  }

  // ============ SYNC QUEUE ============

  async addToSyncQueue(item: Omit<SyncQueueItem, 'attempts'>): Promise<void> {
    const db = this.ensureDB();
    await db.put('sync-queue', { ...item, attempts: 0 });
  }

  async getSyncQueue(): Promise<SyncQueueItem[]> {
    const db = this.ensureDB();
    return db.getAll('sync-queue');
  }

  async removeFromSyncQueue(id: string): Promise<void> {
    const db = this.ensureDB();
    await db.delete('sync-queue', id);
  }

  async incrementSyncAttempt(id: string, error: string): Promise<void> {
    const db = this.ensureDB();
    const item = await db.get('sync-queue', id);
    if (item) {
      item.attempts += 1;
      item.last_error = error;
      await db.put('sync-queue', item);
    }
  }

  // ============ UTILITY ============

  async clearAll(): Promise<void> {
    const db = this.ensureDB();
    await db.clear('pending-transactions');
    await db.clear('cached-services');
    await db.clear('cached-customers');
    await db.clear('sync-queue');
  }

  async getStorageStats(): Promise<{
    pendingTransactions: number;
    cachedServices: number;
    cachedCustomers: number;
    syncQueue: number;
  }> {
    const db = this.ensureDB();
    return {
      pendingTransactions: await db.count('pending-transactions'),
      cachedServices: await db.count('cached-services'),
      cachedCustomers: await db.count('cached-customers'),
      syncQueue: await db.count('sync-queue'),
    };
  }
}

export const offlineStorage = new OfflineStorageService();
export type { OfflineTransaction, CachedService, CachedCustomer };
