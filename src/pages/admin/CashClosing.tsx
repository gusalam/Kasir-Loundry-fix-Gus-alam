import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Check,
  X,
  Loader2,
  Wallet,
  User,
  Calendar,
  AlertTriangle,
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

interface CashClosing {
  id: number;
  user_id: string;
  closing_date: string;
  cash_system: number;
  cash_actual: number;
  difference: number;
  status: string;
  notes: string | null;
  created_at: string;
  profiles?: { name: string } | null;
}

export default function AdminCashClosing() {
  const [closings, setClosings] = useState<CashClosing[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [approveId, setApproveId] = useState<number | null>(null);

  useEffect(() => {
    fetchClosings();
  }, []);

  const fetchClosings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('cash_closings')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      const closingsWithProfiles = await Promise.all(
        (data || []).map(async (closing) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('name')
            .eq('id', closing.user_id)
            .maybeSingle();
          return { ...closing, profiles: profile };
        })
      );

      setClosings(closingsWithProfiles as CashClosing[]);
    } catch (error: any) {
      console.error('Error fetching cash closings:', error);
      toast.error('Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!approveId) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from('cash_closings')
        .update({
          status: 'approved',
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', approveId);

      if (error) throw error;

      toast.success('Tutup kas berhasil di-approve');
      fetchClosings();
    } catch (error: any) {
      toast.error('Gagal approve: ' + error.message);
    } finally {
      setApproveId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingCount = closings.filter(c => c.status === 'pending').length;

  return (
    <MainLayout title="Tutup Kas">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-warning-light">
                <AlertTriangle className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                <p className="text-sm text-muted-foreground">Menunggu Approval</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
                <Check className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">
                  {closings.filter(c => c.status === 'approved').length}
                </p>
                <p className="text-sm text-muted-foreground">Sudah Approved</p>
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
      ) : closings.length === 0 ? (
        <Card>
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Wallet className="h-12 w-12 mb-4 opacity-50" />
            <p>Belum ada tutup kas</p>
          </div>
        </Card>
      ) : (
        <div className="space-y-4">
          {closings.map((closing) => {
            const hasDifference = closing.difference !== 0;
            return (
              <Card key={closing.id} className={hasDifference ? 'border-warning' : ''}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                          <User className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <p className="font-semibold">{closing.profiles?.name || 'Unknown'}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(closing.closing_date), 'dd MMMM yyyy', { locale: id })}
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div>
                          <p className="text-sm text-muted-foreground">Cash Sistem</p>
                          <p className="font-semibold">{formatCurrency(Number(closing.cash_system))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Cash Aktual</p>
                          <p className="font-semibold">{formatCurrency(Number(closing.cash_actual))}</p>
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Selisih</p>
                          <p className={`font-semibold ${closing.difference !== 0 ? 'text-danger' : 'text-success'}`}>
                            {formatCurrency(Number(closing.difference))}
                          </p>
                        </div>
                      </div>

                      {closing.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          Catatan: {closing.notes}
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {closing.status === 'pending' ? (
                        <>
                          <Badge variant="pending">Pending</Badge>
                          <Button
                            size="sm"
                            onClick={() => setApproveId(closing.id)}
                          >
                            <Check className="h-4 w-4" />
                            Approve
                          </Button>
                        </>
                      ) : (
                        <Badge variant="completed">Approved</Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={!!approveId} onOpenChange={() => setApproveId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Tutup Kas?</AlertDialogTitle>
            <AlertDialogDescription>
              Pastikan data tutup kas sudah benar sebelum menyetujui.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Ya, Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}