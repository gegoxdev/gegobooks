import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { token } = await req.json();
    if (!token || typeof token !== 'string' || token.length > 50) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 400, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate token
    const { data: link, error } = await supabaseAdmin
      .from('viewer_links')
      .select('*')
      .eq('token', token)
      .eq('is_active', true)
      .single();

    if (error || !link) {
      return new Response(JSON.stringify({ error: 'Invalid or revoked link' }), { status: 403, headers: corsHeaders });
    }

    // Check expiration
    if (link.expires_at && new Date(link.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: 'This link has expired' }), { status: 403, headers: corsHeaders });
    }

    // Update access stats
    await supabaseAdmin
      .from('viewer_links')
      .update({
        last_accessed_at: new Date().toISOString(),
        access_count: (link.access_count || 0) + 1,
      })
      .eq('id', link.id);

    // Fetch all the read-only dashboard data
    const [
      totalRes,
      todayRes,
      growthRes,
      userTypeRes,
      leaderboardRes,
      projectionRes,
      tierCountsRes,
      revenueRes,
      referralConvRes,
      countryRes,
      userStatsRes,
      arpuRes,
      convRateRes,
      avgRefRes,
      churnRes,
      funnelRes,
      sourcesRes,
    ] = await Promise.all([
      supabaseAdmin.from('total_waitlist_users').select('*').single(),
      supabaseAdmin.from('todays_signups').select('*').single(),
      supabaseAdmin.from('growth_comparisons').select('*').single(),
      supabaseAdmin.from('user_type_distribution').select('*'),
      supabaseAdmin.from('referral_leaderboard').select('*').limit(10),
      supabaseAdmin.from('waitlist_projection_30d').select('*').single(),
      supabaseAdmin.rpc('get_tier_counts'),
      supabaseAdmin.from('paid_tier_revenue').select('*').single(),
      supabaseAdmin.from('referral_conversion').select('*').single(),
      supabaseAdmin.from('country_distribution').select('*'),
      supabaseAdmin.rpc('get_admin_user_stats'),
      supabaseAdmin.from('arpu').select('*').single(),
      supabaseAdmin.from('paid_conversion_rate').select('*').single(),
      supabaseAdmin.from('avg_referrals_per_user').select('*').single(),
      supabaseAdmin.from('churn_rate').select('*').single(),
      supabaseAdmin.from('tier_upgrade_funnel').select('*'),
      supabaseAdmin.from('signup_source_breakdown').select('*'),
    ]);

    // Fetch signup growth (daily)
    const { data: signupGrowth } = await supabaseAdmin.from('signup_growth_daily').select('*');

    return new Response(
      JSON.stringify({
        valid: true,
        label: link.label,
        data: {
          total: totalRes.data?.total || 0,
          today: todayRes.data?.count || 0,
          growth: growthRes.data || {},
          userTypes: userTypeRes.data || [],
          leaderboard: leaderboardRes.data || [],
          projection: projectionRes.data || {},
          tierCounts: tierCountsRes.data || [],
          revenue: revenueRes.data?.revenue_ngn || 0,
          referralConversion: referralConvRes.data?.percentage || 0,
          countries: countryRes.data || [],
          signupGrowth: signupGrowth || [],
          userStats: userStatsRes.data || {},
          arpu: Number(arpuRes.data?.arpu_ngn) || 0,
          paidConversion: {
            conversion_pct: Number(convRateRes.data?.conversion_pct) || 0,
            paid_users: Number(convRateRes.data?.paid_users) || 0,
            total_signups: Number(convRateRes.data?.total_signups) || 0,
          },
          avgReferrals: {
            avg_referrals: Number(avgRefRes.data?.avg_referrals) || 0,
            total_referrals: Number(avgRefRes.data?.total_referrals) || 0,
            users_with_referrals: Number(avgRefRes.data?.users_with_referrals) || 0,
          },
          churn: {
            churn_pct: Number(churnRes.data?.churn_pct) || 0,
            deletion_requests: Number(churnRes.data?.deletion_requests) || 0,
          },
          tierFunnel: (funnelRes.data || []).map((r: any) => ({
            tier: r.tier,
            users: Number(r.users),
            percentage: Number(r.percentage),
          })),
          sources: (sourcesRes.data || []).map((r: any) => ({
            source: r.source,
            signups: Number(r.signups),
            percentage: Number(r.percentage),
          })),
        },
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('validate-viewer-link error:', err);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
