import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const WaitlistProjection = () => {
  const [data, setData] = useState({ current_count: 0, avg_daily_growth: 0, projected_30d: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: d } = await supabase.from('waitlist_projection_30d').select('*').single();
      if (d) setData(d as any);
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Current Waitlist', value: data.current_count },
    { label: 'Avg Daily Growth', value: data.avg_daily_growth },
    { label: 'Projected in 30 Days', value: data.projected_30d },
  ];

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">30-Day Projection</h2>
      <div className={`grid grid-cols-3 gap-4 ${loading ? 'animate-pulse' : ''}`}>
        {cards.map((c) => (
          <div key={c.label} className="text-center">
            <p className="font-heading font-bold text-2xl text-primary">{loading ? '...' : c.value}</p>
            <p className="font-body text-xs text-muted mt-1">{c.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WaitlistProjection;
