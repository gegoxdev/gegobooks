import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

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

const Admin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState('');
  const [signups, setSignups] = useState<Signup[]>([]);
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<SortKey>('created_at');
  const [sortAsc, setSortAsc] = useState(false);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkAdmin(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
    if (data) {
      setAuthed(true);
      fetchSignups();
    } else {
      setAuthError('You are not an admin.');
      await supabase.auth.signOut();
    }
    setAuthLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setAuthError(error.message);
      setAuthLoading(false);
      return;
    }
    if (data.user) checkAdmin(data.user.id);
  };

  const fetchSignups = async () => {
    setLoading(true);
    const { data } = await supabase.from('waitlist_signups').select('*').order('created_at', { ascending: false });
    if (data) setSignups(data as Signup[]);
    setLoading(false);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc(!sortAsc);
    else { setSortKey(key); setSortAsc(true); }
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

  const stats = {
    total: signups.length,
    users: signups.filter((s) => s.user_type === 'user').length,
    accountants: signups.filter((s) => s.user_type === 'accountant').length,
    both: signups.filter((s) => s.user_type === 'both').length,
    totalReferrals: signups.reduce((sum, s) => sum + s.referrals_count, 0),
  };

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

  if (authLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><p className="font-body text-muted">Loading...</p></div>;
  }

  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <form onSubmit={handleLogin} className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm space-y-4">
          <h1 className="font-heading font-bold text-xl text-foreground text-center">Admin Login</h1>
          {authError && <p className="text-destructive text-sm font-body text-center">{authError}</p>}
          <input
            type="email" placeholder="Admin email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
          />
          <input
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full font-body border border-border rounded-lg px-4 py-3 text-sm bg-surface text-foreground"
          />
          <button type="submit" className="w-full bg-primary text-primary-foreground font-body font-semibold py-3 rounded-lg">
            Sign In
          </button>
        </form>
      </div>
    );
  }

  const topReferrers = [...signups].sort((a, b) => b.referrals_count - a.referrals_count).slice(0, 10);

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <h1 className="font-heading font-bold text-xl text-foreground">GegoBooks Admin</h1>
        <button
          onClick={async () => { await supabase.auth.signOut(); setAuthed(false); }}
          className="font-body text-sm text-muted hover:text-foreground"
        >
          Sign Out
        </button>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {[
            { label: 'Total Signups', value: stats.total },
            { label: 'Users', value: stats.users },
            { label: 'Accountants', value: stats.accountants },
            { label: 'Both', value: stats.both },
            { label: 'Total Referrals', value: stats.totalReferrals },
          ].map((s) => (
            <div key={s.label} className="bg-surface rounded-xl border border-border p-4 text-center">
              <p className="font-heading font-bold text-2xl text-primary">{s.value}</p>
              <p className="font-body text-xs text-muted mt-1">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Referral Leaderboard */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Top Referrers</h2>
          <div className="space-y-2">
            {topReferrers.filter((r) => r.referrals_count > 0).length === 0 && (
              <p className="font-body text-sm text-muted">No referrals yet.</p>
            )}
            {topReferrers.filter((r) => r.referrals_count > 0).map((r, i) => (
              <div key={r.id} className="flex items-center gap-3 font-body text-sm">
                <span className="font-heading font-bold text-primary w-6">#{i + 1}</span>
                <span className="text-foreground flex-1">{r.full_name}</span>
                <span className="text-muted">{r.referral_code}</span>
                <span className="font-bold text-primary">{r.referrals_count} referrals</span>
              </div>
            ))}
          </div>
        </div>

        {/* Table */}
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
            <p className="font-body text-sm text-muted">Loading...</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border">
                    {([
                      ['full_name', 'Name'],
                      ['', 'Email'],
                      ['', 'Type'],
                      ['', 'Code'],
                      ['referrals_count', 'Referrals'],
                      ['waitlist_position', 'Position'],
                      ['', 'Referred By'],
                      ['created_at', 'Date'],
                    ] as [string, string][]).map(([key, label]) => (
                      <th
                        key={label}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Admin;
