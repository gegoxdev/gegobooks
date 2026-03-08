import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReferralDashboard from '@/components/ReferralDashboard';

const tierLabels: Record<string, string> = {
  free: 'Free Waitlist',
  priority: 'Priority Access',
  founder: 'Founder Circle',
};

const tierColors: Record<string, string> = {
  free: 'bg-muted/20 text-muted-foreground',
  priority: 'bg-primary/10 text-primary',
  founder: 'bg-accent/10 text-accent',
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [waitlistData, setWaitlistData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate('/login');
        return;
      }
      setUser(session.user);
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      setLoading(true);
      const [waitlistRes, profileRes] = await Promise.all([
        supabase.rpc('get_my_waitlist_status'),
        supabase.from('profiles').select('*').eq('user_id', user.id).maybeSingle(),
      ]);

      if (waitlistRes.data && Array.isArray(waitlistRes.data) && waitlistRes.data.length > 0) {
        setWaitlistData(waitlistRes.data[0]);
      }
      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Loading your dashboard...</div>
      </div>
    );
  }

  const tier = profile?.tier || 'free';

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-lg text-foreground">GegoBooks</h1>
            <span className={`font-body text-xs font-medium px-3 py-1 rounded-full ${tierColors[tier]}`}>
              {tierLabels[tier]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/')}
              className="font-body text-sm text-muted hover:text-foreground transition-colors"
            >
              Home
            </button>
            <button
              onClick={handleSignOut}
              className="font-body text-sm text-muted hover:text-destructive transition-colors"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {/* Position & Ranking */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Your Waitlist Status</h2>
          {waitlistData ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="font-heading font-bold text-3xl text-primary">#{waitlistData.waitlist_position}</p>
                <p className="font-body text-xs text-muted mt-1">Position</p>
              </div>
              <div className="text-center">
                <p className="font-heading font-bold text-3xl text-foreground">{waitlistData.referrals_count}</p>
                <p className="font-body text-xs text-muted mt-1">Referrals</p>
              </div>
              <div className="text-center">
                <p className="font-heading font-bold text-sm text-foreground capitalize">{waitlistData.user_type}</p>
                <p className="font-body text-xs text-muted mt-1">Account Type</p>
              </div>
              <div className="text-center">
                <p className={`font-heading font-bold text-sm ${tier === 'founder' ? 'text-accent' : tier === 'priority' ? 'text-primary' : 'text-muted'}`}>
                  {tierLabels[tier]}
                </p>
                <p className="font-body text-xs text-muted mt-1">Tier</p>
              </div>
            </div>
          ) : (
            <p className="font-body text-sm text-muted">
              No waitlist signup found for this email. Please{' '}
              <button onClick={() => navigate('/')} className="text-primary hover:underline">join the waitlist</button> first.
            </p>
          )}
        </div>

        {/* Upgrade Tier */}
        {tier === 'free' && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">Upgrade Your Access</h2>
            <p className="font-body text-sm text-muted mb-4">Skip the line with a paid tier.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <a
                href="https://paystack.com/pay/gegobooks-priority"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-primary/5 border border-primary/20 rounded-lg p-4 hover:bg-primary/10 transition-colors"
              >
                <p className="font-heading font-bold text-foreground">Priority Waitlist</p>
                <p className="font-body text-sm text-muted mt-1">$1 (₦1,500) — Jump the queue</p>
              </a>
              <a
                href="https://paystack.shop/pay/gegobooks-founders-circle"
                target="_blank"
                rel="noopener noreferrer"
                className="block bg-accent/5 border border-accent/20 rounded-lg p-4 hover:bg-accent/10 transition-colors"
              >
                <p className="font-heading font-bold text-foreground">Founder Circle ⭐</p>
                <p className="font-body text-sm text-muted mt-1">$10 (₦15,000) — First access + perks</p>
              </a>
            </div>
          </div>
        )}

        {/* Referral Section */}
        {waitlistData && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <ReferralDashboard
              referralCode={waitlistData.referral_code}
              waitlistPosition={waitlistData.waitlist_position}
              referralsCount={waitlistData.referrals_count}
              onClose={() => {}}
            />
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
