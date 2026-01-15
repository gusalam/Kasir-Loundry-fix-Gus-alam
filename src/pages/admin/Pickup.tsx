import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { SoftCard } from '@/components/ui/SoftCard';
import { IllustratedStatCard } from '@/components/dashboard/IllustratedStatCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Package,
  Check,
  User,
  Phone,
  Loader2,
  QrCode,
} from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';

interface Transaction {
  id: number;
  invoice_number: string;
  status: string;
  total_amount: number;
  paid_amount: number;
  payment_status: string;
  created_at: string;
  customers: { name: string; phone: string } | null;
}

export default function AdminPickup() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [pickupId, setPickupId] = useState<number | null>(null);

  useEffect(() => {
    fetchReadyTransactions();
  }, []);

  const fetchReadyTransactions = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .eq('status', 'selesai')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data as Transaction[]);
    } catch (error: any) {
      console.error('Error fetching transactions:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePickup = async () => {
    if (!pickupId) return;

    try {
      const { error } = await supabase.from('transactions').update({ status: 'diambil' }).eq('id', pickupId);
      if (error) throw error;
      toast.success('Laundry berhasil diserahkan');
      fetchReadyTransactions();
    } catch (error: any) {
      toast.error('Gagal update status: ' + error.message);
    } finally {
      setPickupId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredTransactions = transactions.filter(t =>
    t.invoice_number.toLowerCase().includes(search.toLowerCase()) ||
    t.customers?.name?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Pengambilan Laundry">
      {/* Stats Card */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-4"
      >
        <IllustratedStatCard
          title="Siap Diambil"
          value={transactions.length}
          subtitle="order menunggu"
          icon={<Package className="h-6 w-6" />}
          illustration="ready"
          variant="success"
        />
      </motion.div>

      {/* Search */}
      <SoftCard className="mb-4">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice atau nama customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
              className="h-12 rounded-xl"
            />
          </div>
          <Button variant="outline" className="h-12 rounded-xl">
            <QrCode className="h-4 w-4 mr-2" />
            Scan
          </Button>
        </div>
      </SoftCard>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <SoftCard className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
            <Package className="h-8 w-8 text-muted-foreground/50" />
          </div>
          <p className="text-muted-foreground">Tidak ada laundry yang siap diambil</p>
        </SoftCard>
      ) : (
        <div className="space-y-3">
          {filteredTransactions.map((trans, idx) => (
            <motion.div
              key={trans.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <SoftCard variant="success" className="border-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                      <Package className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-bold text-foreground">{trans.invoice_number}</p>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {trans.customers?.name || 'Walk-in'}
                        </span>
                        {trans.customers?.phone && (
                          <span className="flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {trans.customers.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-bold text-foreground">{formatCurrency(Number(trans.total_amount))}</p>
                      <Badge variant={trans.payment_status === 'lunas' ? 'success' : 'warning'} className="mt-1">
                        {trans.payment_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      onClick={() => setPickupId(trans.id)}
                      className="h-12 rounded-xl bg-success hover:bg-success/90"
                    >
                      <Check className="h-4 w-4 mr-2" />
                      Serahkan
                    </Button>
                  </div>
                </div>
              </SoftCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Pickup Dialog */}
      <AlertDialog open={!!pickupId} onOpenChange={() => setPickupId(null)}>
        <AlertDialogContent className="rounded-3xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengambilan</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan laundry sudah diterima oleh customer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePickup} className="rounded-xl bg-success hover:bg-success/90">
              Ya, Serahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
