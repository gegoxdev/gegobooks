import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

interface Signup {
  id: string;
  full_name: string;
  email: string;
  user_type: string;
  referral_code: string | null;
  referrals_count: number;
  referred_by: string | null;
  waitlist_position: number | null;
  created_at: string;
  utm_source: string | null;
  tier: string;
}

type SortKey = 'created_at' | 'waitlist_position' | 'referrals_count' | 'full_name';

const tierColors: Record<string, string> = {
  free: 'bg-muted/20 text-muted',
  priority: 'bg-primary/10 text-primary',
  founder: 'bg-accent/10 text-accent',
};

const tierLabels: Record<string, string> = {
  free: 'Free',
  priority: 'Priority',
  founder: 'Founder',
};

const TierDropdown = ({ signup, onUpdate, disabled }: { signup: Signup; onUpdate: () => void; disabled?: boolean }) => {
  const [open, setOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleTierChange = async (newTier: string) => {
    if (newTier === signup.tier) { setOpen(false); return; }
    setUpdating(true);
    const { error } = await supabase.rpc('admin_set_user_tier' as any, {
      target_email: signup.email,
      new_tier: newTier,
    });
    if (error) {
      toast.error(`Failed to update tier: ${error.message}`);
    } else {
      toast.success(`${signup.full_name} updated to ${tierLabels[newTier]}`);
      onUpdate();
    }
    setUpdating(false);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        disabled={updating}
        className={`font-body text-xs px-2 py-0.5 rounded-full font-medium inline-flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity ${tierColors[signup.tier] || tierColors.free}`}
      >
        {updating ? '...' : tierLabels[signup.tier] || signup.tier}
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute z-50 top-full left-0 mt-1 bg-surface border border-border rounded-lg shadow-lg py-1 min-w-[100px]">
            {Object.entries(tierLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => handleTierChange(key)}
                className={`block w-full text-left font-body text-xs px-3 py-1.5 hover:bg-muted/10 transition-colors ${
                  key === signup.tier ? 'font-bold text-foreground' : 'text-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const SignupsTable = () => {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSignups = async () => {
    setLoading(true);
    const { data } = await supabase.rpc('get_admin_signups_with_tiers' as any);
    if (data) setSignups(data as Signup[]);
    setLoading(false);
  };

  useEffect(() => {
    fetchSignups();
    const channel = supabase.channel('table-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_signups' }, () => fetchSignups())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
  };

  const handleDelete = async (signup: Signup) => {
    if (!confirm(`Delete signup for ${signup.full_name} (${signup.email})? Positions below will be moved up.`)) return;
    setDeleting(signup.id);
    const { error } = await supabase.rpc('admin_delete_waitlist_signup', { signup_id: signup.id });
    if (error) {
      toast.error('Failed to delete signup: ' + error.message);
    } else {
      toast.success(`Deleted ${signup.full_name} and reranked waitlist`);
      fetchSignups();
    }
    setDeleting(null);
  };

  const filtered = signups
    .filter((s) => tierFilter === 'all' || s.tier === tierFilter)
    .filter((s) => !filter || s.full_name.toLowerCase().includes(filter.toLowerCase()) || s.email.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const tierCountMap = signups.reduce<Record<string, number>>((acc, s) => {
    acc[s.tier] = (acc[s.tier] || 0) + 1;
    return acc;
  }, {});

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Tier', 'Referral Code', 'Referrals', 'Position', 'Referred By', 'UTM Source', 'Signed Up'];
    const rows = filtered.map((s) => [
      s.full_name, s.email, s.user_type, s.tier, s.referral_code || '', s.referrals_count,
      s.waitlist_position || '', s.referred_by || '', s.utm_source || '', new Date(s.created_at).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((v) => `"${v}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gegobooks-waitlist-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: [string, string][] = [
    ['full_name', 'Name'], ['', 'Email'], ['', 'Type'], ['', 'Tier'], ['', 'Code'],
    ['referrals_count', 'Referrals'], ['waitlist_position', 'Position'],
    ['', 'Referred By'], ['created_at', 'Date'], ['', ''],
  ];

  const tierFilterOptions = [
    { value: 'all', label: `All (${signups.length})` },
    { value: 'free', label: `Free (${tierCountMap.free || 0})` },
    { value: 'priority', label: `Priority (${tierCountMap.priority || 0})` },
    { value: 'founder', label: `Founder (${tierCountMap.founder || 0})` },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">All Signups ({filtered.length})</h2>
        <div className="flex flex-wrap gap-3">
          <div className="flex rounded-lg border border-border overflow-hidden">
            {tierFilterOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTierFilter(opt.value)}
                className={`font-body text-xs px-3 py-2 transition-colors ${
                  tierFilter === opt.value
                    ? 'bg-primary text-primary-foreground font-semibold'
                    : 'bg-surface text-muted hover:bg-muted/10'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <input
            placeholder="Search name or email..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="font-body border border-border rounded-lg px-3 py-2 text-sm bg-surface text-foreground w-64"
          />
          <button onClick={exportCSV} className="bg-primary text-primary-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90">
            Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => <div key={i} className="h-10 animate-pulse bg-background rounded" />)}
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                {columns.map(([key, label], idx) => (
                  <th
                    key={idx}
                    onClick={key ? () => handleSort(key as SortKey) : undefined}
                    className={`font-body text-xs font-semibold text-muted py-3 px-2 ${key ? 'cursor-pointer hover:text-foreground' : ''}`}
                  >
                    {label} {sortKey === key ? (sortAsc ? '↑' : '↓') : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-soft-white transition-colors">
                  <td className="font-body text-sm text-foreground py-3 px-2">{s.full_name}</td>
                  <td className="font-body text-sm text-muted py-3 px-2">{s.email}</td>
                  <td className="py-3 px-2">
                    <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s.user_type}</span>
                  </td>
                  <td className="py-3 px-2">
                    <TierDropdown signup={s} onUpdate={fetchSignups} />
                  </td>
                  <td className="font-body text-xs text-muted py-3 px-2 font-mono">{s.referral_code}</td>
                  <td className="font-body text-sm text-foreground py-3 px-2 font-bold">{s.referrals_count}</td>
                  <td className="font-body text-sm text-muted py-3 px-2">#{s.waitlist_position}</td>
                  <td className="font-body text-xs text-muted py-3 px-2 font-mono">{s.referred_by || '—'}</td>
                  <td className="font-body text-xs text-muted py-3 px-2">{new Date(s.created_at).toLocaleDateString()}</td>
                  <td className="py-3 px-2">
                    <button
                      onClick={() => handleDelete(s)}
                      disabled={deleting === s.id}
                      className="text-muted hover:text-destructive transition-colors disabled:opacity-50"
                      title="Delete signup"
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
  );
};

export default SignupsTable;
