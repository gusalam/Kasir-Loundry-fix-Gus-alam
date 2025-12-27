import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        .select(`
          *,
          customers (name, phone)
        `)
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
      const { error } = await supabase
        .from('transactions')
        .update({ status: 'diambil' })
        .eq('id', pickupId);

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
    <MainLayout title="Pengambilan Laundry">
      {/* Search */}
      <Card className="p-4 mb-6">
        <div className="flex gap-3">
          <div className="flex-1">
            <Input
              placeholder="Cari invoice atau nama customer..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              leftIcon={<Search className="h-4 w-4" />}
            />
          </div>
          <Button variant="outline">
            <QrCode className="h-4 w-4" />
            Scan QR
          </Button>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
                <p className="text-sm text-muted-foreground">Siap Diambil</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filteredTransactions.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Package className="h-12 w-12 mb-4 opacity-50" />
            <p>Tidak ada laundry yang siap diambil</p>
          </div>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTransactions.map((trans) => (
            <Card key={trans.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
                      <Package className="h-6 w-6 text-success" />
                    </div>
                    <div>
                      <p className="font-semibold">{trans.invoice_number}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
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
                      <p className="font-semibold">{formatCurrency(Number(trans.total_amount))}</p>
                      <Badge variant={trans.payment_status === 'lunas' ? 'success' : 'warning'}>
                        {trans.payment_status.replace('_', ' ')}
                      </Badge>
                    </div>
                    <Button
                      variant="default"
                      onClick={() => setPickupId(trans.id)}
                    >
                      <Check className="h-4 w-4" />
                      Serahkan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Pickup Dialog */}
      <AlertDialog open={!!pickupId} onOpenChange={() => setPickupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Konfirmasi Pengambilan</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan laundry sudah diterima oleh customer. Status akan berubah menjadi "Diambil".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handlePickup}>
              Ya, Serahkan
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}