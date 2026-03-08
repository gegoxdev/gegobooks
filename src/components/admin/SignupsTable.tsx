import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Trash2 } from 'lucide-react';
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
}

type SortKey = 'created_at' | 'waitlist_position' | 'referrals_count' | 'full_name';

const SignupsTable = () => {
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchSignups = async () => {
    setLoading(true);
    const { data } = await supabase.from('waitlist_signups').select('*').order('created_at', { ascending: false });
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
    .filter((s) => !filter || s.full_name.toLowerCase().includes(filter.toLowerCase()) || s.email.toLowerCase().includes(filter.toLowerCase()))
    .sort((a, b) => {
      const av = a[sortKey] ?? '';
      const bv = b[sortKey] ?? '';
      if (av < bv) return sortAsc ? -1 : 1;
      if (av > bv) return sortAsc ? 1 : -1;
      return 0;
    });

  const exportCSV = () => {
    const headers = ['Name', 'Email', 'Type', 'Referral Code', 'Referrals', 'Position', 'Referred By', 'UTM Source', 'Signed Up'];
    const rows = filtered.map((s) => [
      s.full_name, s.email, s.user_type, s.referral_code || '', s.referrals_count,
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
    ['full_name', 'Name'], ['', 'Email'], ['', 'Type'], ['', 'Code'],
    ['referrals_count', 'Referrals'], ['waitlist_position', 'Position'],
    ['', 'Referred By'], ['created_at', 'Date'], ['', ''],
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">All Signups ({filtered.length})</h2>
        <div className="flex gap-3">
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
