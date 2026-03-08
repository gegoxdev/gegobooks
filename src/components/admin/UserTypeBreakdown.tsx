import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

const COLORS = ['hsl(145, 83%, 34%)', 'hsl(222, 47%, 11%)', 'hsl(38, 92%, 50%)'];

const UserTypeBreakdown = () => {
  const [data, setData] = useState<{ name: string; value: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const { data: d } = await supabase.from('user_type_distribution').select('*');
      if (d) setData((d as any[]).map((r) => ({ name: r.user_type, value: r.count })));
      setLoading(false);
    };
    fetch();
  }, []);

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="bg-surface rounded-xl border border-border p-6">
      <h2 className="font-heading font-bold text-lg text-foreground mb-4">User Types</h2>
      {loading ? (
        <div className="h-48 animate-pulse bg-background rounded-lg" />
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <PieChart>
            <Pie data={data} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, value }) => `${name} (${((value / total) * 100).toFixed(0)}%)`}>
              {data.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      )}
    </div>
  );
};

export default UserTypeBreakdown;
