import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, Activity, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface Stats {
  total_accounts: number;
  confirmed_accounts: number;
  unconfirmed_accounts: number;
  accounts_today: number;
  accounts_this_week: number;
  accounts_this_month: number;
  last_sign_in_24h: number;
  last_sign_in_7d: number;
  never_signed_in: number;
}

interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name: string | null;
  tier: string | null;
  created_at: string;
  deleted_at: string | null;
}

const UserAccountStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAccounts, setShowAccounts] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [profilesLoading, setProfilesLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchStats = async () => {
    const { data } = await supabase.rpc('get_admin_user_stats');
    if (data) setStats(data as unknown as Stats);
    setLoading(false);
  };

  const fetchProfiles = async () => {
    setProfilesLoading(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    if (data) setProfiles(data as Profile[]);
    setProfilesLoading(false);
  };

  useEffect(() => { fetchStats(); }, []);

  useEffect(() => {
    if (showAccounts) fetchProfiles();
  }, [showAccounts]);

  const handleDeleteAccount = async (profile: Profile) => {
    if (!confirm(`Permanently delete account for ${profile.email}? This cannot be undone.`)) return;
    setDeletingId(profile.user_id);
    const { error } = await supabase.rpc('admin_delete_user_account', { target_user_id: profile.user_id });
    if (error) {
      toast.error('Failed to delete account: ' + error.message);
    } else {
      toast.success(`Deleted account: ${profile.email}`);
      fetchProfiles();
      fetchStats();
    }
    setDeletingId(null);
  };

  if (loading) {
    return (
      <div className="bg-surface rounded-xl border border-border p-6">
        <h2 className="font-heading font-bold text-lg text-foreground mb-4">User Accounts</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(9)].map((_, i) => <div key={i} className="h-20 animate-pulse bg-background rounded-lg" />)}
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const cards = [
    { icon: Users, label: 'Total Accounts', value: stats.total_accounts, color: 'text-primary' },
    { icon: UserCheck, label: 'Confirmed', value: stats.confirmed_accounts, color: 'text-primary' },
    { icon: UserX, label: 'Unconfirmed', value: stats.unconfirmed_accounts, color: 'text-destructive' },
    { icon: Activity, label: 'Created Today', value: stats.accounts_today, color: 'text-accent' },
    { icon: Activity, label: 'This Week', value: stats.accounts_this_week, color: 'text-accent' },
    { icon: Activity, label: 'This Month', value: stats.accounts_this_month, color: 'text-accent' },
    { icon: Clock, label: 'Active (24h)', value: stats.last_sign_in_24h, color: 'text-primary' },
    { icon: Clock, label: 'Active (7d)', value: stats.last_sign_in_7d, color: 'text-primary' },
    { icon: UserX, label: 'Never Signed In', value: stats.never_signed_in, color: 'text-muted' },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">User Accounts</h2>
        <button
          onClick={() => setShowAccounts(!showAccounts)}
          className="font-body text-sm text-primary hover:underline"
        >
          {showAccounts ? 'Hide Accounts' : 'Manage Accounts'}
        </button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {cards.map((c) => (
          <div key={c.label} className="bg-background rounded-lg border border-border p-4 flex items-center gap-3">
            <c.icon className={`w-5 h-5 ${c.color} shrink-0`} />
            <div>
              <p className="font-heading font-bold text-xl text-foreground">{c.value.toLocaleString()}</p>
              <p className="font-body text-xs text-muted">{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {showAccounts && (
        <div className="mt-6">
          {profilesLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-background rounded" />)}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Name</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Email</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Tier</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Status</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2">Joined</th>
                    <th className="font-body text-xs font-semibold text-muted py-3 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {profiles.map((p) => (
                    <tr key={p.id} className="border-b border-border/50 hover:bg-soft-white transition-colors">
                      <td className="font-body text-sm text-foreground py-3 px-2">{p.full_name || '—'}</td>
                      <td className="font-body text-sm text-muted py-3 px-2">{p.email}</td>
                      <td className="py-3 px-2">
                        <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{p.tier || 'free'}</span>
                      </td>
                      <td className="py-3 px-2">
                        {p.deleted_at ? (
                          <span className="font-body text-xs bg-destructive/10 text-destructive px-2 py-0.5 rounded-full">
                            Deletion requested
                          </span>
                        ) : (
                          <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">Active</span>
                        )}
                      </td>
                      <td className="font-body text-xs text-muted py-3 px-2">{new Date(p.created_at).toLocaleDateString()}</td>
                      <td className="py-3 px-2">
                        <button
                          onClick={() => handleDeleteAccount(p)}
                          disabled={deletingId === p.user_id}
                          className="text-muted hover:text-destructive transition-colors disabled:opacity-50"
                          title="Delete account"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UserAccountStats;
