import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatCard } from '@/components/dashboard/StatCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Calendar,
} from 'lucide-react';
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subDays } from 'date-fns';
import { id } from 'date-fns/locale';

type DateRange = 'today' | 'yesterday' | 'week' | 'month' | 'last7' | 'last30';

interface DashboardStats {
  ordersToday: number;
  revenueToday: number;
  expensesToday: number;
  profitToday: number;
  pendingOrders: number;
  readyOrders: number;
}

const dateRangeLabels: Record<DateRange, string> = {
  today: 'Hari Ini',
  yesterday: 'Kemarin',
  week: 'Minggu Ini',
  month: 'Bulan Ini',
  last7: '7 Hari Terakhir',
  last30: '30 Hari Terakhir',
};

const getDateRange = (range: DateRange): { start: Date; end: Date; dateFormat: string } => {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
  const todayEnd = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

  switch (range) {
    case 'today':
      return { start: todayStart, end: todayEnd, dateFormat: format(now, 'yyyy-MM-dd') };
    case 'yesterday':
      const yesterday = subDays(now, 1);
      return {
        start: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0),
        end: new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59),
        dateFormat: format(yesterday, 'yyyy-MM-dd'),
      };
    case 'week':
      return {
        start: startOfWeek(now, { weekStartsOn: 1 }),
        end: endOfWeek(now, { weekStartsOn: 1 }),
        dateFormat: format(now, 'yyyy-MM-dd'),
      };
    case 'month':
      return {
        start: startOfMonth(now),
        end: endOfMonth(now),
        dateFormat: format(now, 'yyyy-MM-dd'),
      };
    case 'last7':
      return {
        start: subDays(todayStart, 6),
        end: todayEnd,
        dateFormat: format(now, 'yyyy-MM-dd'),
      };
    case 'last30':
      return {
        start: subDays(todayStart, 29),
        end: todayEnd,
        dateFormat: format(now, 'yyyy-MM-dd'),
      };
    default:
      return { start: todayStart, end: todayEnd, dateFormat: format(now, 'yyyy-MM-dd') };
  }
};

export default function AdminDashboard() {
  const { profile, user } = useAuth();
  const navigate = useNavigate();
  const [dateRange, setDateRange] = useState<DateRange>('today');
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
  }, [dateRange]);

  const fetchDashboardData = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      const { start, end } = getDateRange(dateRange);
      const startISO = start.toISOString();
      const endISO = end.toISOString();
      const startDate = format(start, 'yyyy-MM-dd');
      const endDate = format(end, 'yyyy-MM-dd');

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('id')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (transError) throw transError;

      const { data: payments, error: payError } = await supabase
        .from('payments')
        .select('amount')
        .gte('created_at', startISO)
        .lte('created_at', endISO);

      if (payError) throw payError;

      const { data: expenses, error: expError } = await supabase
        .from('expenses')
        .select('amount')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

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
        {/* Greeting & Date Filter */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              Selamat Datang, {displayName} 👋
            </h2>
            <p className="text-muted-foreground mt-1">
              Ringkasan bisnis laundry - {dateRangeLabels[dateRange]}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <Select value={dateRange} onValueChange={(val) => setDateRange(val as DateRange)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Pilih periode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Hari Ini</SelectItem>
                <SelectItem value="yesterday">Kemarin</SelectItem>
                <SelectItem value="week">Minggu Ini</SelectItem>
                <SelectItem value="month">Bulan Ini</SelectItem>
                <SelectItem value="last7">7 Hari Terakhir</SelectItem>
                <SelectItem value="last30">30 Hari Terakhir</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Grid - 4 columns on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title={`Order ${dateRangeLabels[dateRange]}`}
            value={stats.ordersToday}
            subtitle="transaksi"
            icon={<ShoppingCart className="h-5 w-5" />}
            variant="primary"
          />
          <StatCard
            title={`Omzet ${dateRangeLabels[dateRange]}`}
            value={formatCurrency(stats.revenueToday)}
            subtitle="pendapatan"
            icon={<TrendingUp className="h-5 w-5" />}
            variant="success"
          />
          <StatCard
            title="Pengeluaran"
            value={formatCurrency(stats.expensesToday)}
            subtitle={dateRangeLabels[dateRange].toLowerCase()}
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
