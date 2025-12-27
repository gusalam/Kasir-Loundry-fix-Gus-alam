import { useState, useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Plus,
  Loader2,
  Edit2,
  Tags,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Service {
  id: number;
  name: string;
  type: string;
  price: number;
  is_active: boolean;
  created_at: string;
}

export default function AdminServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<string>('kiloan');
  const [formPrice, setFormPrice] = useState<number>(0);
  const [formActive, setFormActive] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('name');

      if (error) throw error;
      setServices(data as Service[]);
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDialog = (service?: Service) => {
    if (service) {
      setEditingService(service);
      setFormName(service.name);
      setFormType(service.type);
      setFormPrice(service.price);
      setFormActive(service.is_active);
    } else {
      setEditingService(null);
      setFormName('');
      setFormType('kiloan');
      setFormPrice(0);
      setFormActive(true);
    }
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formName.trim()) {
      toast.error('Nama layanan wajib diisi');
      return;
    }
    if (formPrice <= 0) {
      toast.error('Harga harus lebih dari 0');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingService) {
        const { error } = await supabase
          .from('services')
          .update({
            name: formName,
            type: formType as any,
            price: formPrice,
            is_active: formActive,
          })
          .eq('id', editingService.id);

        if (error) throw error;
        toast.success('Layanan berhasil diupdate');
      } else {
        const { error } = await supabase
          .from('services')
          .insert({
            name: formName,
            type: formType as any,
            price: formPrice,
            is_active: formActive,
          });

        if (error) throw error;
        toast.success('Layanan berhasil ditambahkan');
      }

      setShowDialog(false);
      fetchServices();
    } catch (error: any) {
      toast.error('Gagal menyimpan: ' + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleActive = async (service: Service) => {
    try {
      const { error } = await supabase
        .from('services')
        .update({ is_active: !service.is_active })
        .eq('id', service.id);

      if (error) throw error;
      toast.success(`Layanan ${!service.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchServices();
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const { error } = await supabase
        .from('services')
        .delete()
        .eq('id', deleteId);

      if (error) throw error;
      toast.success('Layanan berhasil dihapus');
      fetchServices();
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

  const filteredServices = services.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <MainLayout title="Manajemen Layanan">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cari layanan..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchServices}>
            <RefreshCw className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4" />
            Tambah Layanan
          </Button>
        </div>
      </div>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <Tags className="h-12 w-12 mb-4" />
            <p>Tidak ada layanan ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Nama Layanan</th>
                  <th className="text-left p-4 font-medium">Tipe</th>
                  <th className="text-left p-4 font-medium">Harga</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredServices.map((service) => (
                  <tr key={service.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Tags className="h-5 w-5 text-primary" />
                        </div>
                        <span className="font-medium">{service.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={service.type === 'kiloan' ? 'default' : 'secondary'}>
                        {service.type === 'kiloan' ? 'Kiloan' : 'Satuan'}
                      </Badge>
                    </td>
                    <td className="p-4 font-medium text-primary">
                      {formatCurrency(service.price)}
                      <span className="text-sm text-muted-foreground font-normal">
                        /{service.type === 'kiloan' ? 'kg' : 'pcs'}
                      </span>
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={service.is_active}
                        onCheckedChange={() => handleToggleActive(service)}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1">
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => handleOpenDialog(service)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          onClick={() => setDeleteId(service.id)}
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
              {editingService ? 'Edit Layanan' : 'Tambah Layanan'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nama Layanan *</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Nama layanan"
              />
            </div>
            <div className="space-y-2">
              <Label>Tipe *</Label>
              <Select value={formType} onValueChange={setFormType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="kiloan">Kiloan (per kg)</SelectItem>
                  <SelectItem value="satuan">Satuan (per pcs)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Harga *</Label>
              <Input
                type="number"
                value={formPrice}
                onChange={(e) => setFormPrice(Number(e.target.value))}
                placeholder="0"
              />
            </div>
            <div className="flex items-center justify-between">
              <Label>Status Aktif</Label>
              <Switch
                checked={formActive}
                onCheckedChange={setFormActive}
              />
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Layanan?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Layanan akan dihapus permanen.
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