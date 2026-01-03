import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import {
  Store,
  Receipt,
  MessageCircle,
  Phone,
  MapPin,
  FileText,
  Save,
  Loader2,
  Settings as SettingsIcon,
  Image,
  Printer,
} from 'lucide-react';
import { motion } from 'framer-motion';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface ReceiptSettings {
  id?: number;
  business_name: string;
  address: string | null;
  phone: string | null;
  footer_text: string | null;
  paper_size: string;
  show_logo: boolean;
  whatsapp_enabled: boolean;
}

export default function AdminSettings() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState<ReceiptSettings>({
    business_name: 'POS Laundry',
    address: '',
    phone: '',
    footer_text: 'Terima kasih atas kepercayaan Anda!',
    paper_size: '58mm',
    show_logo: true,
    whatsapp_enabled: false,
  });

  useEffect(() => {
    fetchSettings();
  }, [user]);

  const fetchSettings = async () => {
    if (!user) return;
    
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('receipt_settings')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setSettings({
          id: data.id,
          business_name: data.business_name,
          address: data.address,
          phone: data.phone,
          footer_text: data.footer_text,
          paper_size: data.paper_size,
          show_logo: data.show_logo,
          whatsapp_enabled: data.whatsapp_enabled,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings:', error);
      toast.error('Gagal memuat pengaturan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    try {
      setIsSaving(true);

      const settingsData = {
        user_id: user.id,
        business_name: settings.business_name,
        address: settings.address || null,
        phone: settings.phone || null,
        footer_text: settings.footer_text || null,
        paper_size: settings.paper_size,
        show_logo: settings.show_logo,
        whatsapp_enabled: settings.whatsapp_enabled,
      };

      if (settings.id) {
        // Update existing
        const { error } = await supabase
          .from('receipt_settings')
          .update(settingsData)
          .eq('id', settings.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('receipt_settings')
          .insert(settingsData);

        if (error) throw error;
      }

      toast.success('Pengaturan berhasil disimpan');
      fetchSettings();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Gagal menyimpan pengaturan');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <AdminLayout title="Pengaturan">
        <div className="flex flex-col items-center justify-center h-64 gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Memuat pengaturan...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout title="Pengaturan">
      <div className="space-y-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="text-xl font-bold text-foreground flex items-center gap-2">
            <SettingsIcon className="h-6 w-6" />
            Pengaturan
          </h2>
          <p className="text-sm text-muted-foreground">
            Konfigurasi bisnis, struk, dan integrasi
          </p>
        </motion.div>

        {/* Business Profile */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Store className="h-5 w-5 text-primary" />
              Profil Bisnis
            </CardTitle>
            <CardDescription>
              Informasi bisnis yang ditampilkan di struk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Nama Bisnis</Label>
              <Input
                id="business_name"
                value={settings.business_name}
                onChange={(e) => setSettings({ ...settings, business_name: e.target.value })}
                placeholder="Nama laundry Anda"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone" className="flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Nomor Telepon
              </Label>
              <Input
                id="phone"
                value={settings.phone || ''}
                onChange={(e) => setSettings({ ...settings, phone: e.target.value })}
                placeholder="08123456789"
                className="h-12 rounded-xl"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="address" className="flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Alamat
              </Label>
              <Textarea
                id="address"
                value={settings.address || ''}
                onChange={(e) => setSettings({ ...settings, address: e.target.value })}
                placeholder="Alamat lengkap bisnis"
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>
          </CardContent>
        </Card>

        {/* Receipt Settings */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Receipt className="h-5 w-5 text-warning" />
              Pengaturan Struk
            </CardTitle>
            <CardDescription>
              Konfigurasi tampilan dan format struk
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paper_size" className="flex items-center gap-2">
                <Printer className="h-4 w-4" />
                Ukuran Kertas
              </Label>
              <Select
                value={settings.paper_size}
                onValueChange={(value) => setSettings({ ...settings, paper_size: value })}
              >
                <SelectTrigger className="h-12 rounded-xl">
                  <SelectValue placeholder="Pilih ukuran" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="58mm">58mm (Thermal Kecil)</SelectItem>
                  <SelectItem value="80mm">80mm (Thermal Besar)</SelectItem>
                  <SelectItem value="A4">A4 (Kertas Biasa)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="footer_text" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Teks Footer
              </Label>
              <Textarea
                id="footer_text"
                value={settings.footer_text || ''}
                onChange={(e) => setSettings({ ...settings, footer_text: e.target.value })}
                placeholder="Teks yang muncul di bawah struk"
                className="min-h-[80px] rounded-xl resize-none"
              />
            </div>

            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Image className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">Tampilkan Logo</p>
                  <p className="text-xs text-muted-foreground">Logo bisnis di struk</p>
                </div>
              </div>
              <Switch
                checked={settings.show_logo}
                onCheckedChange={(checked) => setSettings({ ...settings, show_logo: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* WhatsApp Integration */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-success" />
              Integrasi WhatsApp
            </CardTitle>
            <CardDescription>
              Kirim notifikasi ke pelanggan via WhatsApp
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <MessageCircle className="h-5 w-5 text-success" />
                </div>
                <div>
                  <p className="font-medium text-sm">Aktifkan WhatsApp</p>
                  <p className="text-xs text-muted-foreground">
                    Kirim struk & notifikasi via WA
                  </p>
                </div>
              </div>
              <Switch
                checked={settings.whatsapp_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, whatsapp_enabled: checked })}
              />
            </div>

            {settings.whatsapp_enabled && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4 p-4 bg-success/5 border border-success/20 rounded-xl"
              >
                <p className="text-sm text-success font-medium mb-1">WhatsApp Aktif</p>
                <p className="text-xs text-muted-foreground">
                  Pelanggan akan menerima notifikasi saat transaksi selesai.
                  Pastikan nomor telepon pelanggan valid.
                </p>
              </motion.div>
            )}
          </CardContent>
        </Card>

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full h-14 text-base rounded-2xl"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Menyimpan...
            </>
          ) : (
            <>
              <Save className="h-5 w-5 mr-2" />
              Simpan Pengaturan
            </>
          )}
        </Button>
      </div>
    </AdminLayout>
  );
}
