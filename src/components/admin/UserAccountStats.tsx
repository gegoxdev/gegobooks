import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Users, UserCheck, UserX, Clock, Activity } from 'lucide-react';

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

const UserAccountStats = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase.rpc('get_admin_user_stats');
      if (data) setStats(data as unknown as Stats);
      setLoading(false);
    };
    fetch();
  }, []);

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
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">User Accounts</h2>
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
    </div>
  );
};

export default UserAccountStats;
