import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { MobileStatCard } from '@/components/dashboard/MobileStatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  ShoppingCart,
  TrendingUp,
  Wallet,
  TrendingDown,
  Package,
  Clock,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  expensesToday: number;
  profitToday: number;
  pendingOrders: number;
  readyOrders: number;
}

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    ordersToday: 0,
    revenueToday: 0,
    expensesToday: 0,
    profitToday: 0,
    pendingOrders: 0,
    readyOrders: 0,
  });
  const [recentTransactions, setRecentTransactions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName = profile?.name || user?.email?.split('@')[0] || 'Admin';

  useEffect(() => {
    fetchDashboardData();

    // Set up realtime subscription
    const channel = supabase
      .channel('admin-dashboard-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions' },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'payments' },
        () => fetchDashboardData()
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'expenses' },
        () => fetchDashboardData()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDashboardData = useCallback(async () => {
    try {
      setError(null);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (transError) throw transError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', todayStart.toISOString())
        .lte('created_at', todayEnd.toISOString());

      if (payError) throw payError;

      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);

      if (expError) throw expError;

      const { data: pendingData } = await supabase
        .from('transactions')
        .select('id')
        .in('status', ['diterima', 'diproses', 'qc']);

      const { data: readyData } = await supabase
        .from('transactions')
        .select('id')
        .eq('status', 'selesai');

      const { data: recent } = await supabase
        .from('transactions')
        .select(`*, customers (name, phone)`)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;

      setStats({
        ordersToday: transactions?.length || 0,
        revenueToday: totalRevenue,
        expensesToday: totalExpenses,
        profitToday: totalRevenue - totalExpenses,
        pendingOrders: pendingData?.length || 0,
        readyOrders: readyData?.length || 0,
      });

      setRecentTransactions(recent || []);
    } catch (error: any) {
      console.error('Error fetching dashboard data:', error);
      setError(error.message || 'Gagal memuat data');
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleRefresh = async () => {
    await fetchDashboardData();
    toast.success('Data berhasil diperbarui');
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      diterima: 'pending',
      diproses: 'processing',
      qc: 'processing',
      selesai: 'ready',
      diambil: 'completed',
    };
    return variants[status] || 'default';
  };

  const getStatusLabel = (status: string): string => {
    const labels: Record<string, string> = {
      diterima: 'Diterima',
      diproses: 'Diproses',
      qc: 'QC',
      selesai: 'Selesai',
      diambil: 'Diambil',
    };
    return labels[status] || status;
  };

  if (isLoading) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </AdminLayout>
    );
  }

  if (error) {
    return (
      <AdminLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline" className="h-12 rounded-xl">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Dashboard">
      <PullToRefresh onRefresh={handleRefresh}>
      <div className="space-y-6">
        {/* Greeting */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-foreground">
            Halo, {displayName} 👋
          </h2>
          <p className="text-sm text-muted-foreground">
            Ringkasan bisnis laundry Anda hari ini
          </p>
        </motion.div>

        {/* Stats Grid - 2 columns mobile */}
        <div className="grid grid-cols-2 gap-3">
          <MobileStatCard
            title="Order Hari Ini"
            value={stats.ordersToday}
            subtitle="transaksi"
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="primary"
          />
          <MobileStatCard
            title="Omzet"
            value={formatCurrency(stats.revenueToday)}
            subtitle="hari ini"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <MobileStatCard
            title="Pengeluaran"
            value={formatCurrency(stats.expensesToday)}
            subtitle="hari ini"
            icon={<TrendingDown className="h-5 w-5" />}
            variant="warning"
          />
          <MobileStatCard
            title="Laba Bersih"
            value={formatCurrency(stats.profitToday)}
            subtitle={stats.profitToday >= 0 ? 'profit' : 'rugi'}
            icon={<Wallet className="h-5 w-5" />}
            variant={stats.profitToday >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/pengambilan')}
            className="bg-card p-4 rounded-2xl border-2 border-border text-left active:scale-[0.98] touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-success/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.readyOrders}</p>
                <p className="text-xs text-muted-foreground">Siap Diambil</p>
              </div>
            </div>
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={() => navigate('/admin/daftar-transaksi?status=diproses')}
            className="bg-card p-4 rounded-2xl border-2 border-border text-left active:scale-[0.98] touch-manipulation"
          >
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-warning/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-foreground">{stats.pendingOrders}</p>
                <p className="text-xs text-muted-foreground">Dalam Proses</p>
              </div>
            </div>
          </motion.button>
        </div>

        {/* Recent Transactions */}
        <Card className="shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
            <CardTitle className="text-base">Transaksi Terbaru</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              className="text-xs"
              onClick={() => navigate('/admin/daftar-transaksi')}
            >
              Semua
              <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            {recentTransactions.length === 0 ? (
              <div className="text-center py-6">
                <ShoppingCart className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.slice(0, 5).map((trans) => (
                  <motion.button
                    key={trans.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    onClick={() => navigate(`/admin/daftar-transaksi?id=${trans.id}`)}
                    className="w-full flex items-center justify-between p-3 bg-muted/50 rounded-xl active:scale-[0.98] touch-manipulation text-left"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {trans.invoice_number}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {trans.customers?.name || 'Walk-in'} • {format(new Date(trans.created_at), 'HH:mm', { locale: id })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 ml-2">
                      <Badge variant={getStatusBadge(trans.status) as any} className="text-[10px]">
                        {getStatusLabel(trans.status)}
                      </Badge>
                      <p className="font-semibold text-sm whitespace-nowrap">
                        {formatCurrency(Number(trans.total_amount))}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </CardContent>
      </Card>
      </div>
      </PullToRefresh>
    </AdminLayout>
  );
}
