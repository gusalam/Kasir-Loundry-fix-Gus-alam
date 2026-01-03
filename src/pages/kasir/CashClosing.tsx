import { useState, useEffect } from 'react';
import { KasirLayout } from '@/components/kasir/KasirLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Loader2,
  Wallet,
  TrendingUp,
  TrendingDown,
  Calculator,
  Clock,
  CheckCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface CashClosing {
  id: number;
  closing_date: string;
  cash_system: number;
  cash_actual: number;
  difference: number;
  status: string;
  notes: string | null;
  created_at: string;
}

export default function KasirCashClosing() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cashSystem, setCashSystem] = useState(0);
  const [cashActual, setCashActual] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [todayClosing, setTodayClosing] = useState<CashClosing | null>(null);
  const [recentClosings, setRecentClosings] = useState<CashClosing[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');

      // Check if today's closing already exists
      const { data: existingClosing } = await supabase
        .from('cash_closings')
        .select('*')
        .eq('closing_date', today)
        .maybeSingle();

      if (existingClosing) {
        setTodayClosing(existingClosing as CashClosing);
      }

      // Calculate today's cash from payments (cash method only)
      const { data: payments } = await supabase
        .from('payments')
        .select('amount')
        .eq('method', 'cash')
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`);

      const totalCash = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      setCashSystem(totalCash);

      // Fetch recent closings
      const { data: recent } = await supabase
        .from('cash_closings')
        .select('*')
        .order('closing_date', { ascending: false })
        .limit(5);

      setRecentClosings(recent as CashClosing[] || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('Session tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const difference = cashActual - cashSystem;

      const { error } = await supabase
        .from('cash_closings')
        .insert({
          user_id: user.id,
          closing_date: today,
          cash_system: cashSystem,
          cash_actual: cashActual,
          difference,
          notes,
        });

      if (error) throw error;

      toast.success('Tutup kas berhasil disimpan');
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const difference = cashActual - cashSystem;

  if (isLoading) {
    return (
      <KasirLayout>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </KasirLayout>
    );
  }

  // If today's closing already exists
  if (todayClosing) {
    return (
      <KasirLayout>
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-8 text-center">
            <div className="flex h-16 w-16 mx-auto mb-4 items-center justify-center rounded-full bg-success-light">
              <CheckCircle className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-xl font-bold mb-2">Kas Hari Ini Sudah Ditutup</h2>
            <p className="text-muted-foreground mb-6">
              Tutup kas untuk {format(new Date(todayClosing.closing_date), 'dd MMMM yyyy', { locale: id })} sudah dilakukan.
            </p>
            <div className="grid grid-cols-3 gap-4 p-4 bg-muted rounded-lg">
              <div>
                <p className="text-sm text-muted-foreground">Kas Sistem</p>
                <p className="font-bold">{formatCurrency(Number(todayClosing.cash_system))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kas Aktual</p>
                <p className="font-bold">{formatCurrency(Number(todayClosing.cash_actual))}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selisih</p>
                <p className={`font-bold ${Number(todayClosing.difference) >= 0 ? 'text-success' : 'text-danger'}`}>
                  {formatCurrency(Number(todayClosing.difference))}
                </p>
              </div>
            </div>
            {todayClosing.status === 'pending' && (
              <p className="text-sm text-warning mt-4">
                <Clock className="h-4 w-4 inline mr-1" />
                Menunggu persetujuan admin
              </p>
            )}
          </CardContent>
        </Card>

        {/* Recent Closings */}
        <Card className="max-w-2xl mx-auto mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Riwayat Tutup Kas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentClosings.map((closing) => (
                <div key={closing.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">
                      {format(new Date(closing.closing_date), 'dd MMMM yyyy', { locale: id })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Sistem: {formatCurrency(Number(closing.cash_system))}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${Number(closing.difference) >= 0 ? 'text-success' : 'text-danger'}`}>
                      {Number(closing.difference) >= 0 ? '+' : ''}{formatCurrency(Number(closing.difference))}
                    </p>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      closing.status === 'approved' 
                        ? 'bg-success-light text-success' 
                        : 'bg-warning-light text-warning'
                    }`}>
                      {closing.status === 'approved' ? 'Disetujui' : 'Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </KasirLayout>
    );
  }

  return (
    <KasirLayout>
      <div className="max-w-2xl mx-auto">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-light">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Kas Sistem (Cash)</p>
                <p className="text-xl font-bold">{formatCurrency(cashSystem)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                difference >= 0 ? 'bg-success-light' : 'bg-danger-light'
              }`}>
                {difference >= 0 ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-danger" />
                )}
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Selisih</p>
                <p className={`text-xl font-bold ${difference >= 0 ? 'text-success' : 'text-danger'}`}>
                  {difference >= 0 ? '+' : ''}{formatCurrency(difference)}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calculator className="h-5 w-5" />
              Input Tutup Kas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Kas Sistem (Otomatis)</Label>
              <Input
                value={formatCurrency(cashSystem)}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Total pembayaran cash hari ini
              </p>
            </div>

            <div className="space-y-2">
              <Label>Kas Aktual</Label>
              <Input
                type="number"
                value={cashActual}
                onChange={(e) => setCashActual(Number(e.target.value))}
                placeholder="Masukkan jumlah uang cash aktual"
              />
              <p className="text-xs text-muted-foreground">
                Hitung dan masukkan jumlah uang cash yang ada di laci
              </p>
            </div>

            <div className="space-y-2">
              <Label>Catatan (Opsional)</Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Catatan tambahan jika ada selisih..."
                rows={3}
              />
            </div>

            {difference !== 0 && cashActual > 0 && (
              <div className={`p-4 rounded-lg ${
                difference >= 0 ? 'bg-success-light' : 'bg-danger-light'
              }`}>
                <p className={`font-medium ${difference >= 0 ? 'text-success' : 'text-danger'}`}>
                  {difference > 0 
                    ? `Kelebihan: ${formatCurrency(difference)}`
                    : `Kekurangan: ${formatCurrency(Math.abs(difference))}`
                  }
                </p>
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleSubmit}
              disabled={isSubmitting || cashActual <= 0}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Memproses...
                </>
              ) : (
                <>
                  <Wallet className="h-4 w-4" />
                  Simpan Tutup Kas
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Recent Closings */}
        {recentClosings.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">Riwayat Tutup Kas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentClosings.map((closing) => (
                  <div key={closing.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">
                        {format(new Date(closing.closing_date), 'dd MMMM yyyy', { locale: id })}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Sistem: {formatCurrency(Number(closing.cash_system))}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className={`font-bold ${Number(closing.difference) >= 0 ? 'text-success' : 'text-danger'}`}>
                        {Number(closing.difference) >= 0 ? '+' : ''}{formatCurrency(Number(closing.difference))}
                      </p>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        closing.status === 'approved' 
                          ? 'bg-success-light text-success' 
                          : 'bg-warning-light text-warning'
                      }`}>
                        {closing.status === 'approved' ? 'Disetujui' : 'Pending'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </KasirLayout>
  );
}