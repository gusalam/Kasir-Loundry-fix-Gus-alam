import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  Receipt,
  RefreshCw,
  TrendingDown,
  Calendar,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

interface Expense {
  id: number;
  description: string;
  amount: number;
  category_id: number | null;
  payment_method: string;
  expense_date: string;
  created_at: string;
  expense_categories?: { name: string } | null;
}

interface ExpenseCategory {
  id: number;
  name: string;
  is_active: boolean;
}

export default function AdminExpenses() {
  const { user } = useAuth();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [todayTotal, setTodayTotal] = useState(0);
  const [monthTotal, setMonthTotal] = useState(0);

  // Form state
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formCategory, setFormCategory] = useState<string>('');
  const [formMethod, setFormMethod] = useState<string>('cash');
  const [formDate, setFormDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const monthStart = format(new Date(), 'yyyy-MM-01');

      // Fetch expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select(`
          *,
          expense_categories (name)
        `)
        .order('expense_date', { ascending: false });

      if (expensesError) throw expensesError;

      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('expense_categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) throw categoriesError;

      // Calculate totals
      const todayExpenses = (expensesData as Expense[])
        .filter(e => e.expense_date === today)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      const monthExpenses = (expensesData as Expense[])
        .filter(e => e.expense_date >= monthStart)
        .reduce((sum, e) => sum + Number(e.amount), 0);

      setExpenses(expensesData as Expense[]);
      setCategories(categoriesData as ExpenseCategory[]);
      setTodayTotal(todayExpenses);
      setMonthTotal(monthExpenses);
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (expense?: Expense) => {
    if (expense) {
      setEditingExpense(expense);
      setFormDescription(expense.description);
      setFormAmount(expense.amount);
      setFormCategory(expense.category_id?.toString() || '');
      setFormMethod(expense.payment_method);
      setFormDate(expense.expense_date);
    } else {
      setEditingExpense(null);
      setFormDescription('');
      setFormAmount(0);
      setFormCategory('');
      setFormMethod('cash');
      setFormDate(format(new Date(), 'yyyy-MM-dd'));
    }
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formDescription.trim()) {
      toast.error('Deskripsi wajib diisi');
      return;
    }
    if (formAmount <= 0) {
      toast.error('Jumlah harus lebih dari 0');
      return;
    }
    if (!user) {
      toast.error('Session tidak valid');
      return;
    }

    setIsSubmitting(true);
    try {
      const expenseData = {
        description: formDescription,
        amount: formAmount,
        category_id: formCategory ? Number(formCategory) : null,
        payment_method: formMethod as any,
        expense_date: formDate,
        created_by: user.id,
      };

      if (editingExpense) {
        const { error } = await supabase
          .from('expenses')
          .update(expenseData)
          .eq('id', editingExpense.id);

        if (error) throw error;
        toast.success('Pengeluaran berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('expenses')
          .insert(expenseData);

        if (error) throw error;
        toast.success('Pengeluaran berhasil ditambahkan');
      }

      setShowDialog(false);
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Pengeluaran berhasil dihapus');
      fetchData();
    } catch (error: any) {
      toast.error('Gagal menghapus: ' + error.message);
    } finally {
      setDeleteId(null);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const filteredExpenses = expenses.filter(e =>
    e.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Manajemen Pengeluaran">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger-light">
              <TrendingDown className="h-5 w-5 text-danger" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pengeluaran Hari Ini</p>
              <p className="text-xl font-bold text-danger">{formatCurrency(todayTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning-light">
              <Calendar className="h-5 w-5 text-warning" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pengeluaran Bulan Ini</p>
              <p className="text-xl font-bold text-warning">{formatCurrency(monthTotal)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cari pengeluaran..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchData}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" />
            Tambah Pengeluaran
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredExpenses.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Receipt className="h-12 w-12 mb-4" />
            <p>Tidak ada pengeluaran ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Tanggal</th>
                  <th className="text-left p-4 font-medium">Deskripsi</th>
                  <th className="text-left p-4 font-medium">Kategori</th>
                  <th className="text-left p-4 font-medium">Metode</th>
                  <th className="text-left p-4 font-medium">Jumlah</th>
                  <th className="text-left p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-muted/50">
                    <td className="p-4 text-sm">
                      {format(new Date(expense.expense_date), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="p-4 font-medium">{expense.description}</td>
                    <td className="p-4 text-muted-foreground">
                      {expense.expense_categories?.name || '-'}
                    </td>
                    <td className="p-4 capitalize">{expense.payment_method}</td>
                    <td className="p-4 font-medium text-danger">
                      {formatCurrency(expense.amount)}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(expense)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteId(expense.id)}
                        >
                          <Trash2 className="h-4 w-4 text-danger" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingExpense ? 'Edit Pengeluaran' : 'Tambah Pengeluaran'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Tanggal *</Label>
              <Input
                type="date"
                value={formDate}
                onChange={(e) => setFormDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Deskripsi *</Label>
              <Textarea
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder="Deskripsi pengeluaran"
                rows={2}
              />
            </div>
            <div className="space-y-2">
              <Label>Kategori</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Pilih kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.id} value={cat.id.toString()}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Jumlah *</Label>
              <Input
                type="number"
                value={formAmount}
                onChange={(e) => setFormAmount(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="space-y-2">
              <Label>Metode Pembayaran</Label>
              <Select value={formMethod} onValueChange={setFormMethod}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="qris">QRIS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button onClick={handleSubmit} className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                'Simpan'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Pengeluaran?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Pengeluaran akan dihapus permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Batal</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-danger text-danger-foreground hover:bg-danger/90">
              Hapus
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}