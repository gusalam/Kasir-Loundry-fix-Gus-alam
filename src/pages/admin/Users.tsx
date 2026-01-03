import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import {
  Search,
  Loader2,
  UserCog,
  RefreshCw,
  Shield,
  User,
} from 'lucide-react';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface UserProfile {
  id: string;
  name: string;
  is_active: boolean;
  created_at: string;
  role?: string;
}

interface UserRole {
  user_id: string;
  role: string;
}

export default function AdminUsers() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('name');

      if (profilesError) throw profilesError;

      // Fetch roles
      const { data: roles, error: rolesError } = await supabase
        .from('user_roles')
        .select('user_id, role');

      if (rolesError) throw rolesError;

      // Merge profiles with roles
      const usersWithRoles = (profiles as UserProfile[]).map(profile => {
        const userRole = (roles as UserRole[]).find(r => r.user_id === profile.id);
        return {
          ...profile,
          role: userRole?.role || 'kasir',
        };
      });

      setUsers(usersWithRoles);
    } catch (error: any) {
      toast.error('Gagal memuat data: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (user: UserProfile) => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: !user.is_active })
        .eq('id', user.id);

      if (error) throw error;
      toast.success(`User ${!user.is_active ? 'diaktifkan' : 'dinonaktifkan'}`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Gagal mengubah status: ' + error.message);
    }
  };

  const handleChangeRole = async (user: UserProfile, newRole: string) => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .update({ role: newRole as any })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success(`Role berhasil diubah ke ${newRole}`);
      fetchUsers();
    } catch (error: any) {
      toast.error('Gagal mengubah role: ' + error.message);
    }
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <AdminLayout title="Manajemen User Kasir">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input
            placeholder="Cari user..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="h-4 w-4" />}
          />
        </div>
        <Button variant="outline" onClick={fetchUsers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-4 mb-6 bg-info-light border-info/20">
        <div className="flex items-start gap-3">
          <Shield className="h-5 w-5 text-info mt-0.5" />
          <div>
            <p className="font-medium text-info">Informasi</p>
            <p className="text-sm text-muted-foreground">
              User baru otomatis terdaftar dengan role Kasir. Anda dapat mengubah role atau menonaktifkan user di sini.
            </p>
          </div>
        </div>
      </Card>

      {/* Table */}
      <Card>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <UserCog className="h-12 w-12 mb-4" />
            <p>Tidak ada user ditemukan</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50 border-b">
                <tr>
                  <th className="text-left p-4 font-medium">Nama</th>
                  <th className="text-left p-4 font-medium">Role</th>
                  <th className="text-left p-4 font-medium">Status</th>
                  <th className="text-left p-4 font-medium">Terdaftar</th>
                  <th className="text-left p-4 font-medium">Aktif</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                          user.role === 'admin' ? 'bg-primary' : 'bg-secondary'
                        } text-white`}>
                          {user.role === 'admin' ? (
                            <Shield className="h-5 w-5" />
                          ) : (
                            <User className="h-5 w-5" />
                          )}
                        </div>
                        <span className="font-medium">{user.name}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          variant={user.role === 'kasir' ? 'default' : 'outline'}
                          onClick={() => handleChangeRole(user, 'kasir')}
                          disabled={user.role === 'kasir'}
                        >
                          Kasir
                        </Button>
                        <Button
                          size="sm"
                          variant={user.role === 'admin' ? 'default' : 'outline'}
                          onClick={() => handleChangeRole(user, 'admin')}
                          disabled={user.role === 'admin'}
                        >
                          Admin
                        </Button>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge variant={user.is_active ? 'success' : 'danger'}>
                        {user.is_active ? 'Aktif' : 'Nonaktif'}
                      </Badge>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">
                      {format(new Date(user.created_at), 'dd MMM yyyy', { locale: id })}
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleActive(user)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AdminLayout>
  );
}