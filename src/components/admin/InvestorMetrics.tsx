import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, DollarSign, Users, Share2, ArrowDownRight, Layers } from 'lucide-react';

interface InvestorData {
  arpu: number;
  paidConversion: { conversion_pct: number; paid_users: number; total_signups: number };
  avgReferrals: { avg_referrals: number; total_referrals: number; users_with_referrals: number };
  sources: { source: string; signups: number; percentage: number }[];
  churn: { churn_pct: number; deletion_requests: number };
  tierFunnel: { tier: string; users: number; percentage: number }[];
  dayOfWeek: { day_name: string; day_num: number; signups: number }[];
}

const tierLabels: Record<string, string> = { free: 'Free', priority: 'Priority', founder: 'Founder' };
const tierColors: Record<string, string> = { free: 'hsl(var(--muted))', priority: 'hsl(var(--primary))', founder: 'hsl(var(--accent))' };

const InvestorMetrics = () => {
  const [data, setData] = useState<InvestorData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [arpuRes, convRes, refRes, srcRes, churnRes, funnelRes, dowRes] = await Promise.all([
        supabase.from('arpu' as any).select('*').single(),
        supabase.from('paid_conversion_rate' as any).select('*').single(),
        supabase.from('avg_referrals_per_user' as any).select('*').single(),
        supabase.from('signup_source_breakdown' as any).select('*'),
        supabase.from('churn_rate' as any).select('*').single(),
        supabase.from('tier_upgrade_funnel' as any).select('*'),
        supabase.from('signups_by_day_of_week' as any).select('*'),
      ]);

      setData({
        arpu: Number(arpuRes.data?.arpu_ngn) || 0,
        paidConversion: {
          conversion_pct: Number(convRes.data?.conversion_pct) || 0,
          paid_users: Number(convRes.data?.paid_users) || 0,
          total_signups: Number(convRes.data?.total_signups) || 0,
        },
        avgReferrals: {
          avg_referrals: Number(refRes.data?.avg_referrals) || 0,
          total_referrals: Number(refRes.data?.total_referrals) || 0,
          users_with_referrals: Number(refRes.data?.users_with_referrals) || 0,
        },
        sources: ((srcRes.data as any[]) || []).map((r: any) => ({
          source: r.source,
          signups: Number(r.signups),
          percentage: Number(r.percentage),
        })),
        churn: {
          churn_pct: Number(churnRes.data?.churn_pct) || 0,
          deletion_requests: Number(churnRes.data?.deletion_requests) || 0,
        },
        tierFunnel: ((funnelRes.data as any[]) || []).map((r: any) => ({
          tier: r.tier,
          users: Number(r.users),
          percentage: Number(r.percentage),
        })),
        dayOfWeek: ((dowRes.data as any[]) || []).map((r: any) => ({
          day_name: r.day_name,
          day_num: Number(r.day_num),
          signups: Number(r.signups),
        })),
      });
      setLoading(false);
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 animate-pulse bg-surface rounded-xl border border-border" />)}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const kpiCards = [
    { icon: DollarSign, label: 'ARPU (₦)', value: `₦${data.arpu.toLocaleString()}`, sub: 'Paid users only', color: 'text-accent' },
    { icon: TrendingUp, label: 'Paid Conversion', value: `${data.paidConversion.conversion_pct}%`, sub: `${data.paidConversion.paid_users} of ${data.paidConversion.total_signups}`, color: 'text-primary' },
    { icon: Share2, label: 'Avg Referrals', value: data.avgReferrals.avg_referrals.toString(), sub: `${data.avgReferrals.users_with_referrals} active referrers`, color: 'text-primary' },
    { icon: ArrowDownRight, label: 'Churn Rate', value: `${data.churn.churn_pct}%`, sub: `${data.churn.deletion_requests} deletion requests`, color: 'text-destructive' },
  ];

  return (
    <div className="space-y-6">
      <h2 className="font-heading font-bold text-lg text-foreground flex items-center gap-2">
        <Layers className="w-5 h-5 text-primary" />
        Investor Metrics
      </h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {kpiCards.map((c) => (
          <div key={c.label} className="bg-surface rounded-xl border border-border p-4">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`w-4 h-4 ${c.color}`} />
              <span className="font-body text-xs text-muted">{c.label}</span>
            </div>
            <p className={`font-heading font-bold text-2xl ${c.color}`}>{c.value}</p>
            <p className="font-body text-xs text-muted mt-1">{c.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Tier Funnel */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Tier Distribution Funnel</h3>
          <div className="space-y-3">
            {data.tierFunnel.map((t) => (
              <div key={t.tier}>
                <div className="flex items-center justify-between mb-1">
                  <span className="font-body text-sm text-foreground">{tierLabels[t.tier] || t.tier}</span>
                  <span className="font-body text-xs text-muted">{t.users} ({t.percentage}%)</span>
                </div>
                <div className="w-full bg-muted/20 rounded-full h-3">
                  <div
                    className="rounded-full h-3 transition-all"
                    style={{
                      width: `${Math.max(t.percentage, 2)}%`,
                      backgroundColor: tierColors[t.tier] || 'hsl(var(--muted))',
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Signup Sources */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Acquisition Sources</h3>
          {data.sources.length === 0 ? (
            <p className="font-body text-sm text-muted">No data yet.</p>
          ) : (
            <div className="space-y-2">
              {data.sources.slice(0, 8).map((s, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="font-body text-sm text-foreground truncate capitalize">{s.source}</span>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <span className="font-body text-xs text-muted">{s.percentage}%</span>
                    <span className="font-heading font-bold text-sm text-foreground">{s.signups}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Signups by Day of Week */}
      {data.dayOfWeek.length > 0 && (
        <div className="bg-surface rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold text-base text-foreground mb-4">Engagement by Day of Week</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.dayOfWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="day_name" tick={{ fontSize: 12, fill: 'hsl(var(--muted))' }} />
              <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--surface))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: 8,
                  fontSize: 12,
                }}
              />
              <Bar dataKey="signups" radius={[4, 4, 0, 0]}>
                {data.dayOfWeek.map((_, i) => (
                  <Cell key={i} fill="hsl(var(--primary))" />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
};

export default InvestorMetrics;
