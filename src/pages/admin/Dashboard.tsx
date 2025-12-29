import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Eye,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

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
  }, []);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
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
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat data...</p>
        </div>
      </MainLayout>
    );
  }

  if (error) {
    return (
      <MainLayout title="Dashboard">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <AlertTriangle className="h-12 w-12 text-destructive" />
          <p className="text-destructive font-medium">{error}</p>
          <Button onClick={fetchDashboardData} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Coba Lagi
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-6">
        {/* Greeting */}
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Selamat Datang, {displayName} 👋
          </h2>
          <p className="text-muted-foreground mt-1">
            Ringkasan bisnis laundry Anda hari ini
          </p>
        </div>

        {/* Stats Grid - 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Order Hari Ini"
            value={stats.ordersToday}
            subtitle="transaksi"
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title="Omzet Hari Ini"
            value={formatCurrency(stats.revenueToday)}
            subtitle="pendapatan"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Pengeluaran"
            value={formatCurrency(stats.expensesToday)}
            subtitle="hari ini"
            icon={<TrendingDown className="h-5 w-5" />}
            variant="warning"
          />
          <StatCard
            title="Laba Bersih"
            value={formatCurrency(stats.profitToday)}
            subtitle={stats.profitToday >= 0 ? 'profit' : 'rugi'}
            icon={<Wallet className="h-5 w-5" />}
            variant={stats.profitToday >= 0 ? 'success' : 'danger'}
          />
        </div>

        {/* Quick Status Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => navigate('/admin/pengambilan')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-success/20">
                  <Package className="h-6 w-6 text-success" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.readyOrders}</p>
                  <p className="text-sm text-muted-foreground">Siap Diambil</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card 
            className="cursor-pointer hover:shadow-md transition-shadow" 
            onClick={() => navigate('/admin/daftar-transaksi?status=diproses')}
          >
            <CardContent className="p-4">
              <div className="flex items-center gap-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-warning/20">
                  <Clock className="h-6 w-6 text-warning" />
                </div>
                <div>
                  <p className="text-3xl font-bold text-foreground">{stats.pendingOrders}</p>
                  <p className="text-sm text-muted-foreground">Dalam Proses</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Transactions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Transaksi Terbaru</CardTitle>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => navigate('/admin/daftar-transaksi')}
            >
              Lihat Semua
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingCart className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground">Belum ada transaksi hari ini</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium text-sm">Invoice</th>
                      <th className="text-left p-3 font-medium text-sm">Customer</th>
                      <th className="text-left p-3 font-medium text-sm">Total</th>
                      <th className="text-left p-3 font-medium text-sm">Status</th>
                      <th className="text-left p-3 font-medium text-sm">Waktu</th>
                      <th className="text-left p-3 font-medium text-sm">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {recentTransactions.map((trans) => (
                      <tr key={trans.id} className="hover:bg-muted/50">
                        <td className="p-3 font-medium">{trans.invoice_number}</td>
                        <td className="p-3">{trans.customers?.name || 'Walk-in'}</td>
                        <td className="p-3 font-semibold">{formatCurrency(Number(trans.total_amount))}</td>
                        <td className="p-3">
                          <Badge variant={getStatusBadge(trans.status) as any}>
                            {getStatusLabel(trans.status)}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {format(new Date(trans.created_at), 'HH:mm', { locale: id })}
                        </td>
                        <td className="p-3">
                          <Button 
                            size="icon-sm" 
                            variant="ghost"
                            onClick={() => navigate(`/admin/daftar-transaksi?id=${trans.id}`)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
