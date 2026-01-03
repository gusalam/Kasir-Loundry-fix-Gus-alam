import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Loader2,
  FileBarChart,
  TrendingUp,
  TrendingDown,
  Wallet,
  DollarSign,
  Calendar,
  Download,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { id } from 'date-fns/locale';

interface ReportData {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  totalOrders: number;
  totalCash: number;
  totalTransfer: number;
  totalQris: number;
  dailyData: {
    date: string;
    revenue: number;
    expenses: number;
  }[];
}

export default function AdminReports() {
  const [isLoading, setIsLoading] = useState(true);
  const [startDate, setStartDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));
  const [reportData, setReportData] = useState<ReportData>({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalOrders: 0,
    totalCash: 0,
    totalTransfer: 0,
    totalQris: 0,
    dailyData: [],
  });

  useEffect(() => {
    fetchReportData();
  }, [startDate, endDate]);

  const fetchReportData = async () => {
    setIsLoading(true);
    try {
      // Fetch payments in date range
      const { data: payments, error: paymentsError } = await supabase
        .from('payments')
        .select('amount, method, created_at')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (paymentsError) throw paymentsError;

      // Fetch expenses in date range
      const { data: expenses, error: expensesError } = await supabase
        .from('expenses')
        .select('amount, expense_date')
        .gte('expense_date', startDate)
        .lte('expense_date', endDate);

      if (expensesError) throw expensesError;

      // Fetch transactions count
      const { count: ordersCount, error: ordersError } = await supabase
        .from('transactions')
        .select('id', { count: 'exact' })
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`);

      if (ordersError) throw ordersError;

      // Calculate totals
      const totalRevenue = payments?.reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, e) => sum + Number(e.amount), 0) || 0;
      const totalCash = payments?.filter(p => p.method === 'cash').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalTransfer = payments?.filter(p => p.method === 'transfer').reduce((sum, p) => sum + Number(p.amount), 0) || 0;
      const totalQris = payments?.filter(p => p.method === 'qris').reduce((sum, p) => sum + Number(p.amount), 0) || 0;

      // Group by date for daily data
      const revenueByDate: Record<string, number> = {};
      const expensesByDate: Record<string, number> = {};

      payments?.forEach(p => {
        const date = format(new Date(p.created_at), 'yyyy-MM-dd');
        revenueByDate[date] = (revenueByDate[date] || 0) + Number(p.amount);
      });

      expenses?.forEach(e => {
        expensesByDate[e.expense_date] = (expensesByDate[e.expense_date] || 0) + Number(e.amount);
      });

      const allDates = new Set([...Object.keys(revenueByDate), ...Object.keys(expensesByDate)]);
      const dailyData = Array.from(allDates)
        .sort()
        .map(date => ({
          date,
          revenue: revenueByDate[date] || 0,
          expenses: expensesByDate[date] || 0,
        }));

      setReportData({
        totalRevenue,
        totalExpenses,
        netProfit: totalRevenue - totalExpenses,
        totalOrders: ordersCount || 0,
        totalCash,
        totalTransfer,
        totalQris,
        dailyData,
      });
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const setQuickDate = (type: 'today' | 'week' | 'month' | 'lastMonth') => {
    const today = new Date();
    switch (type) {
      case 'today':
        const todayStr = format(today, 'yyyy-MM-dd');
        setStartDate(todayStr);
        setEndDate(todayStr);
        break;
      case 'week':
        const weekAgo = new Date(today);
        weekAgo.setDate(today.getDate() - 7);
        setStartDate(format(weekAgo, 'yyyy-MM-dd'));
        setEndDate(format(today, 'yyyy-MM-dd'));
        break;
      case 'month':
        setStartDate(format(startOfMonth(today), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(today), 'yyyy-MM-dd'));
        break;
      case 'lastMonth':
        const lastMonth = subMonths(today, 1);
        setStartDate(format(startOfMonth(lastMonth), 'yyyy-MM-dd'));
        setEndDate(format(endOfMonth(lastMonth), 'yyyy-MM-dd'));
        break;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (isLoading) {
    return (
      <AdminLayout title="Laporan">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Laporan">
      {/* Date Filter */}
      <Card className="p-4 mb-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Dari Tanggal</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Sampai Tanggal</Label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setQuickDate('today')}>
              Hari Ini
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('week')}>
              7 Hari
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('month')}>
              Bulan Ini
            </Button>
            <Button variant="outline" size="sm" onClick={() => setQuickDate('lastMonth')}>
              Bulan Lalu
            </Button>
          </div>
        </div>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-success-light">
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Omzet</p>
              <p className="text-xl font-bold text-success">{formatCurrency(reportData.totalRevenue)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-danger-light">
              <TrendingDown className="h-6 w-6 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pengeluaran</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(reportData.totalExpenses)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${
              reportData.netProfit >= 0 ? 'bg-primary-light' : 'bg-danger-light'
            }`}>
              <Wallet className={`h-6 w-6 ${reportData.netProfit >= 0 ? 'text-primary' : 'text-danger'}`} />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Laba Bersih</p>
              <p className={`text-xl font-bold ${reportData.netProfit >= 0 ? 'text-primary' : 'text-danger'}`}>
                {formatCurrency(reportData.netProfit)}
              </p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-info-light">
              <FileBarChart className="h-6 w-6 text-info" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Order</p>
              <p className="text-xl font-bold text-info">{reportData.totalOrders}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Revenue by Payment Method */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Omzet per Metode Pembayaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-success"></div>
                  <span>Cash</span>
                </div>
                <span className="font-bold">{formatCurrency(reportData.totalCash)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-info"></div>
                  <span>Transfer</span>
                </div>
                <span className="font-bold">{formatCurrency(reportData.totalTransfer)}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-primary"></div>
                  <span>QRIS</span>
                </div>
                <span className="font-bold">{formatCurrency(reportData.totalQris)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Daily Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Rekap Harian
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reportData.dailyData.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Tidak ada data</p>
            ) : (
              <div className="max-h-64 overflow-y-auto space-y-2">
                {reportData.dailyData.map((day) => (
                  <div key={day.date} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-sm font-medium">
                      {format(new Date(day.date), 'dd MMM yyyy', { locale: id })}
                    </span>
                    <div className="text-right">
                      <p className="text-sm text-success">+{formatCurrency(day.revenue)}</p>
                      {day.expenses > 0 && (
                        <p className="text-xs text-danger">-{formatCurrency(day.expenses)}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Profit/Loss Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Ringkasan Laba Rugi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Keterangan</th>
                  <th className="text-right p-4 font-medium">Jumlah</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                <tr>
                  <td className="p-4 font-medium text-success">Total Pendapatan (Omzet)</td>
                  <td className="p-4 text-right font-bold text-success">{formatCurrency(reportData.totalRevenue)}</td>
                </tr>
                <tr>
                  <td className="p-4 font-medium text-danger">Total Pengeluaran</td>
                  <td className="p-4 text-right font-bold text-danger">({formatCurrency(reportData.totalExpenses)})</td>
                </tr>
                <tr className="bg-muted/50">
                  <td className="p-4 font-bold text-lg">LABA BERSIH</td>
                  <td className={`p-4 text-right font-bold text-lg ${
                    reportData.netProfit >= 0 ? 'text-primary' : 'text-danger'
                  }`}>
                    {formatCurrency(reportData.netProfit)}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </AdminLayout>
  );
}