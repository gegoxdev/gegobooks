import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Referrer {
  full_name: string;
  referrals_count: number;
}

const ReferralLeaderboard = () => {
  const [data, setData] = useState<Referrer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: d } = await supabase.from('referral_leaderboard').select('full_name, referrals_count');
      if (d) setData(d as any);
      setLoading(false);
    };
    fetch();
  }, []);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">Top Referrers</h2>
      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => <div key={i} className="h-8 animate-pulse bg-background rounded" />)}
        </div>
      ) : data.length === 0 ? (
        <p className="font-body text-sm text-muted">No referrals yet.</p>
      ) : (
        <div className="space-y-2">
          {data.map((r, i) => (
            <div key={i} className="flex items-center gap-3 font-body text-sm">
              <span className="font-heading font-bold text-primary w-6">#{i + 1}</span>
              <div className="flex-1 min-w-0">
                <p className="text-foreground truncate">{r.full_name}</p>
              </div>
              <span className="font-bold text-primary whitespace-nowrap">{r.referrals_count}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ReferralLeaderboard;
