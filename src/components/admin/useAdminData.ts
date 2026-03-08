import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function useAdminData() {
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [todaysSignups, setTodaysSignups] = useState(0);
  const [referralConversion, setReferralConversion] = useState(0);
  const [revenueNgn, setRevenueNgn] = useState(0);
  const [weeklyGrowthRate, setWeeklyGrowthRate] = useState(0);
  const [growthComparisons, setGrowthComparisons] = useState({ dod: 0, wow: 0, mom: 0, yoy: 0 });
  const [userTypeDistribution, setUserTypeDistribution] = useState<{ user_type: string; count: number }[]>([]);
  const [countryDistribution, setCountryDistribution] = useState<{ country: string; users: number }[]>([]);
  const [leaderboard, setLeaderboard] = useState<{ full_name: string; email: string; referrals_count: number; referral_code: string }[]>([]);
  const [projection, setProjection] = useState({ current_count: 0, avg_daily_growth: 0, projected_30d: 0 });
  const [growthData, setGrowthData] = useState<{ period: string; signups: number; growth_rate: number }[]>([]);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      totalRes,
      todayRes,
      refConvRes,
      revenueRes,
      growthCompRes,
      userTypeRes,
      countryRes,
      leaderboardRes,
      projectionRes,
      weeklyRes,
    ] = await Promise.all([
      supabase.from('total_waitlist_users').select('total').single(),
      supabase.from('todays_signups').select('count').single(),
      supabase.from('referral_conversion').select('percentage').single(),
      supabase.from('paid_tier_revenue').select('revenue_ngn').single(),
      supabase.from('growth_comparisons').select('*').single(),
      supabase.from('user_type_distribution').select('*'),
      supabase.from('country_distribution').select('*'),
      supabase.from('referral_leaderboard').select('*'),
      supabase.from('waitlist_projection_30d').select('*').single(),
      supabase.rpc('get_waitlist_growth', { timeframe: 'week' }),
    ]);

    if (totalRes.data) setTotalUsers(totalRes.data.total);
    if (todayRes.data) setTodaysSignups(todayRes.data.count);
    if (refConvRes.data) setReferralConversion(Number(refConvRes.data.percentage));
    if (revenueRes.data) setRevenueNgn(Number(revenueRes.data.revenue_ngn));
    if (growthCompRes.data) setGrowthComparisons({
      dod: Number(growthCompRes.data.dod),
      wow: Number(growthCompRes.data.wow),
      mom: Number(growthCompRes.data.mom),
      yoy: Number(growthCompRes.data.yoy),
    });
    if (userTypeRes.data) setUserTypeDistribution(userTypeRes.data as any);
    if (countryRes.data) setCountryDistribution(countryRes.data as any);
    if (leaderboardRes.data) setLeaderboard(leaderboardRes.data as any);
    if (projectionRes.data) setProjection(projectionRes.data as any);
    if (weeklyRes.data && Array.isArray(weeklyRes.data) && weeklyRes.data.length > 0) {
      const last = weeklyRes.data[weeklyRes.data.length - 1] as any;
      setWeeklyGrowthRate(Number(last.growth_rate) || 0);
    }

    setLoading(false);
  }, []);

  const fetchGrowthData = useCallback(async (timeframe: string) => {
    const { data } = await supabase.rpc('get_waitlist_growth', { timeframe });
    if (data) setGrowthData((data as any).map((d: any) => ({ period: d.period, signups: Number(d.signups), growth_rate: Number(d.growth_rate) })));
  }, []);

  useEffect(() => {
    fetchAll();
    fetchGrowthData('day');

    const channel = supabase
      .channel('admin-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'waitlist_signups' }, () => {
        fetchAll();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchAll, fetchGrowthData]);

  return {
    loading, totalUsers, todaysSignups, referralConversion, revenueNgn,
    weeklyGrowthRate, growthComparisons, userTypeDistribution, countryDistribution,
    leaderboard, projection, growthData, fetchGrowthData, fetchAll,
  };
}
