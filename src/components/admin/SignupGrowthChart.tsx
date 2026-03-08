import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const timeframes = ['hour', 'day', 'week', 'month', 'year'] as const;

const SignupGrowthChart = () => {
  const [active, setActive] = useState<string>('day');
  const [data, setData] = useState<{ period: string; signups: number }[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async (tf: string) => {
    setLoading(true);
    const { data: d } = await supabase.rpc('get_waitlist_growth', { timeframe: tf });
    if (d) setData((d as any[]).map((r) => ({ period: r.period, signups: Number(r.signups) })));
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(active); }, [active, fetchData]);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
        <h2 className="font-heading font-bold text-lg text-foreground">Signup Growth</h2>
        <div className="flex gap-1 bg-background rounded-lg p-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActive(tf)}
              className={`font-body text-xs px-3 py-1.5 rounded-md capitalize transition-colors ${
                active === tf ? 'bg-primary text-primary-foreground' : 'text-muted hover:text-foreground'
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>
      {loading ? (
        <div className="h-64 animate-pulse bg-background rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="period" tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} />
            <YAxis tick={{ fontSize: 11, fill: 'hsl(var(--muted))' }} />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--surface))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area type="monotone" dataKey="signups" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
          </AreaChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default SignupGrowthChart;
