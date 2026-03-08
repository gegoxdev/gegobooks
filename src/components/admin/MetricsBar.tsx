import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const MetricsBar = () => {
  const [metrics, setMetrics] = useState({ total: 0, today: 0, referralPct: 0, revenue: 0, weeklyGrowth: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [totalRes, todayRes, refRes, revRes, weeklyRes] = await Promise.all([
        supabase.from('total_waitlist_users').select('total').single(),
        supabase.from('todays_signups').select('count').single(),
        supabase.from('referral_conversion').select('percentage').single(),
        supabase.from('paid_tier_revenue').select('revenue_ngn').single(),
        supabase.rpc('get_waitlist_growth', { timeframe: 'week' }),
      ]);
      setMetrics({
        total: totalRes.data?.total ?? 0,
        today: todayRes.data?.count ?? 0,
        referralPct: Number(refRes.data?.percentage ?? 0),
        revenue: Number(revRes.data?.revenue_ngn ?? 0),
        weeklyGrowth: (() => {
          if (weeklyRes.data && Array.isArray(weeklyRes.data) && weeklyRes.data.length > 0) {
            return Number((weeklyRes.data[weeklyRes.data.length - 1] as any).growth_rate) || 0;
          }
          return 0;
        })(),
      });
      setLoading(false);
    };
    fetch();

    const channel = supabase.channel('metrics-rt')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_signups' }, () => fetch())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const cards = [
    { label: 'Total Waitlist Users', value: loading ? '...' : metrics.total.toLocaleString() },
    { label: "Today's Signups", value: loading ? '...' : metrics.today.toLocaleString() },
    { label: 'Referral Conversion', value: loading ? '...' : `${metrics.referralPct}%` },
    { label: 'Revenue (NGN)', value: loading ? '...' : `₦${metrics.revenue.toLocaleString()}` },
    { label: 'Weekly Growth', value: loading ? '...' : `${metrics.weeklyGrowth}%` },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`bg-surface rounded-xl border border-border p-4 text-center ${loading ? 'animate-pulse' : ''}`}>
          <p className="font-heading font-bold text-2xl text-primary">{c.value}</p>
          <p className="font-body text-xs text-muted mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default MetricsBar;
