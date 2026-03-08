import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { UserPlus, Trash2, ChevronDown, Shield, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

interface AdminUser {
  admin_id: string;
  user_id: string;
  email: string;
  role: string;
  created_at: string;
}

const roleConfig: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  readonly: { label: 'Read Only', icon: Shield, color: 'bg-muted/20 text-muted' },
  admin: { label: 'Admin', icon: ShieldCheck, color: 'bg-primary/10 text-primary' },
  master: { label: 'Master', icon: ShieldAlert, color: 'bg-accent/10 text-accent' },
};

const AdminManagement = () => {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('readonly');
  const [adding, setAdding] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);

  const fetchAdmins = async () => {
    const { data } = await supabase.rpc('admin_list_admins' as any);
    if (data) setAdmins(data as AdminUser[]);
    setLoading(false);
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setAdding(true);
    const { error } = await supabase.rpc('admin_add_admin' as any, {
      target_email: email.trim(),
      admin_role: role,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Added ${email.trim()} as ${roleConfig[role].label}`);
      setEmail('');
      setRole('readonly');
      fetchAdmins();
    }
    setAdding(false);
  };

  const handleRemove = async (admin: AdminUser) => {
    if (!confirm(`Remove admin access for ${admin.email}?`)) return;
    setRemovingId(admin.user_id);
    const { error } = await supabase.rpc('admin_remove_admin' as any, {
      target_user_id: admin.user_id,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Removed ${admin.email}`);
      fetchAdmins();
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (admin: AdminUser, newRole: string) => {
    if (newRole === admin.role) { setEditingId(null); return; }
    const { error } = await supabase.rpc('admin_add_admin' as any, {
      target_email: admin.email,
      admin_role: newRole,
    });
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(`Updated ${admin.email} to ${roleConfig[newRole].label}`);
      fetchAdmins();
    }
    setEditingId(null);
  };

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">Admin Management</h2>

      {/* Add admin form */}
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="email"
          placeholder="User email address..."
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground flex-1"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground"
        >
          <option value="readonly">Read Only</option>
          <option value="admin">Admin</option>
          <option value="master">Master</option>
        </select>
        <button
          type="submit"
          disabled={adding}
          className="bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          {adding ? 'Adding...' : 'Add Admin'}
        </button>
      </form>

      {/* Admin list */}
      {loading ? (
        <div className="space-y-2">
          {[...Array(2)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-background rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="font-body text-xs font-semibold text-muted py-3 px-2">Email</th>
                <th className="font-body text-xs font-semibold text-muted py-3 px-2">Role</th>
                <th className="font-body text-xs font-semibold text-muted py-3 px-2">Added</th>
                <th className="font-body text-xs font-semibold text-muted py-3 px-2"></th>
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => {
                const config = roleConfig[a.role] || roleConfig.readonly;
                const RoleIcon = config.icon;
                return (
                  <tr key={a.admin_id} className="border-b border-border/50 hover:bg-soft-white transition-colors">
                    <td className="font-body text-sm text-foreground py-3 px-2">{a.email}</td>
                    <td className="py-3 px-2 relative">
                      <button
                        onClick={() => setEditingId(editingId === a.user_id ? null : a.user_id)}
                        className={`font-body text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${config.color}`}
                      >
                        <RoleIcon className="w-3 h-3" />
                        {config.label}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {editingId === a.user_id && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setEditingId(null)} />
                          <div className="absolute z-50 top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[120px]">
                            {Object.entries(roleConfig).map(([key, rc]) => (
                              <button
                                key={key}
                                onClick={() => handleRoleChange(a, key)}
                                className={`block w-full text-left font-body text-xs px-3 py-1.5 hover:bg-muted/10 transition-colors ${
                                  key === a.role ? 'font-bold text-foreground' : 'text-muted'
                                }`}
                              >
                                {rc.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </td>
                    <td className="font-body text-xs text-muted py-3 px-2">
                      {new Date(a.created_at).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-2">
                      <button
                        onClick={() => handleRemove(a)}
                        disabled={removingId === a.user_id}
                        className="text-muted hover:text-destructive transition-colors disabled:opacity-50"
                        title="Remove admin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;
