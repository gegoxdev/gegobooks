import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Eye, AlertTriangle } from 'lucide-react';

interface ViewerData {
  total: number;
  today: number;
  growth: { dod?: number; wow?: number; mom?: number; yoy?: number };
  userTypes: { user_type: string; count: number }[];
  leaderboard: { full_name: string; referrals_count: number }[];
  projection: { current_count?: number; projected_30d?: number; avg_daily_growth?: number };
  tierCounts: { tier_id: string; tier_label: string; max_capacity: number; current_count: number }[];
  revenue: number;
  referralConversion: number;
  countries: { country: string; users: number }[];
  signupGrowth: { date: string; signups: number }[];
  userStats: Record<string, number>;
}

interface ViewerDashboardProps {
  token: string;
}

const ViewerDashboard = ({ token }: ViewerDashboardProps) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [label, setLabel] = useState('');
  const [data, setData] = useState<ViewerData | null>(null);

  useEffect(() => {
    const validate = async () => {
      const { data: result, error: fnError } = await supabase.functions.invoke('validate-viewer-link', {
        body: { token },
      });

      if (fnError || result?.error) {
        setError(result?.error || fnError?.message || 'Invalid link');
        setLoading(false);
        return;
      }

      setLabel(result.label);
      setData(result.data);
      setLoading(false);
    };

    validate();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Validating access...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="bg-surface rounded-2xl shadow-lg border border-border p-8 w-full max-w-sm text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h1 className="font-heading font-bold text-xl text-foreground">Access Denied</h1>
          <p className="font-body text-sm text-muted">{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const growthEntries = [
    { label: 'Day/Day', value: data.growth.dod },
    { label: 'Week/Week', value: data.growth.wow },
    { label: 'Month/Month', value: data.growth.mom },
    { label: 'Year/Year', value: data.growth.yoy },
  ];

  const userStatCards = [
    { label: 'Total Accounts', value: data.userStats?.total_accounts || 0 },
    { label: 'Confirmed', value: data.userStats?.confirmed_accounts || 0 },
    { label: 'Active (24h)', value: data.userStats?.last_sign_in_24h || 0 },
    { label: 'Active (7d)', value: data.userStats?.last_sign_in_7d || 0 },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h1 className="font-heading font-bold text-xl text-foreground">GegoBooks Dashboard</h1>
          <span className="font-body text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full inline-flex items-center gap-1">
            <Eye className="w-3 h-3" />
            Viewer: {label}
          </span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <MetricCard label="Total Waitlist" value={data.total.toLocaleString()} />
          <MetricCard label="Today's Signups" value={data.today.toLocaleString()} />
          <MetricCard label="Revenue (₦)" value={Number(data.revenue).toLocaleString()} />
          <MetricCard label="Referral Rate" value={`${data.referralConversion}%`} />
        </div>

        {/* User Account Stats */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">User Accounts</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {userStatCards.map(c => (
              <div key={c.label} className="bg-background rounded-lg border border-border p-4">
                <p className="font-heading font-bold text-xl text-foreground">{c.value.toLocaleString()}</p>
                <p className="font-body text-xs text-muted">{c.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Growth */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Growth Comparisons</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {growthEntries.map(g => (
              <div key={g.label} className="bg-background rounded-lg border border-border p-4">
                <p className={`font-heading font-bold text-xl ${(g.value || 0) >= 0 ? 'text-primary' : 'text-destructive'}`}>
                  {(g.value || 0) >= 0 ? '+' : ''}{g.value?.toFixed(1) || '0'}%
                </p>
                <p className="font-body text-xs text-muted">{g.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tier Counts */}
        {data.tierCounts.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Tier Distribution</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {data.tierCounts.map(tc => (
                <div key={tc.tier_id} className="bg-background rounded-lg border border-border p-4">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-body text-sm font-medium text-foreground">{tc.tier_label}</p>
                    <p className="font-body text-xs text-muted">{tc.current_count}/{tc.max_capacity}</p>
                  </div>
                  <div className="w-full bg-muted/20 rounded-full h-2">
                    <div
                      className="bg-primary rounded-full h-2 transition-all"
                      style={{ width: `${Math.min((tc.current_count / tc.max_capacity) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signup Growth Chart */}
        {data.signupGrowth.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Daily Signups</h2>
            <div className="overflow-x-auto">
              <div className="flex items-end gap-1 h-32 min-w-[300px]">
                {data.signupGrowth.slice(-30).map((d, i) => {
                  const max = Math.max(...data.signupGrowth.slice(-30).map(s => s.signups || 1));
                  const height = ((d.signups || 0) / max) * 100;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center justify-end" title={`${d.date}: ${d.signups}`}>
                      <div
                        className="w-full bg-primary/60 rounded-t hover:bg-primary transition-colors min-h-[2px]"
                        style={{ height: `${height}%` }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {/* User Types */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">User Types</h2>
            <div className="space-y-3">
              {data.userTypes.map(ut => (
                <div key={ut.user_type} className="flex items-center justify-between">
                  <span className="font-body text-sm text-foreground capitalize">{ut.user_type}</span>
                  <span className="font-heading font-bold text-foreground">{ut.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Leaderboard */}
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Referral Leaderboard</h2>
            <div className="space-y-3">
              {data.leaderboard.map((l, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="font-body text-sm text-foreground">
                    <span className="text-muted mr-2">#{i + 1}</span>
                    {l.full_name}
                  </span>
                  <span className="font-heading font-bold text-primary">{l.referrals_count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Projection */}
        {data.projection.projected_30d && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">30-Day Projection</h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-background rounded-lg border border-border p-4 text-center">
                <p className="font-heading font-bold text-xl text-foreground">{data.projection.current_count?.toLocaleString()}</p>
                <p className="font-body text-xs text-muted">Current</p>
              </div>
              <div className="bg-background rounded-lg border border-border p-4 text-center">
                <p className="font-heading font-bold text-xl text-primary">{data.projection.projected_30d?.toLocaleString()}</p>
                <p className="font-body text-xs text-muted">Projected (30d)</p>
              </div>
              <div className="bg-background rounded-lg border border-border p-4 text-center">
                <p className="font-heading font-bold text-xl text-foreground">{Number(data.projection.avg_daily_growth).toFixed(1)}</p>
                <p className="font-body text-xs text-muted">Avg Daily Growth</p>
              </div>
            </div>
          </div>
        )}

        {/* Country Distribution */}
        {data.countries.length > 0 && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-4">Country Distribution</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {data.countries.map((c, i) => (
                <div key={i} className="bg-background rounded-lg border border-border p-3 flex items-center justify-between">
                  <span className="font-body text-sm text-foreground">{c.country}</span>
                  <span className="font-heading font-bold text-foreground">{c.users}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center py-4">
          <p className="font-body text-xs text-muted">
            This is a read-only view. Data is live from GegoBooks dashboard.
          </p>
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-surface rounded-xl border border-border p-4">
    <p className="font-heading font-bold text-2xl text-foreground">{value}</p>
    <p className="font-body text-xs text-muted">{label}</p>
  </div>
);

export default ViewerDashboard;
