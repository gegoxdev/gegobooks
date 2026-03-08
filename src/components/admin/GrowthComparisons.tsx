import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

const GrowthComparisons = () => {
  const [data, setData] = useState({ dod: 0, wow: 0, mom: 0, yoy: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: d } = await supabase.from('growth_comparisons').select('*').single();
      if (d) setData({ dod: Number(d.dod), wow: Number(d.wow), mom: Number(d.mom), yoy: Number(d.yoy) });
      setLoading(false);
    };
    fetch();
  }, []);

  const cards = [
    { label: 'Day-over-Day', value: data.dod },
    { label: 'Week-over-Week', value: data.wow },
    { label: 'Month-over-Month', value: data.mom },
    { label: 'Year-over-Year', value: data.yoy },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className={`bg-surface rounded-xl border border-border p-4 text-center ${loading ? 'animate-pulse' : ''}`}>
          <div className="flex items-center justify-center gap-1">
            <span className={`font-heading font-bold text-xl ${c.value >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {c.value >= 0 ? '↑' : '↓'} {Math.abs(c.value)}%
            </span>
          </div>
          <p className="font-body text-xs text-muted mt-1">{c.label}</p>
        </div>
      ))}
    </div>
  );
};

export default GrowthComparisons;
