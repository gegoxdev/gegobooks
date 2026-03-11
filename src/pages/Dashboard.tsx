import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import ReferralDashboard from '@/components/ReferralDashboard';
import { toast } from 'sonner';
import { AlertTriangle } from 'lucide-react';
import { openPaystackPopup, TIER_PRICES, getPendingPayment, clearPendingPayment } from '@/lib/paystack';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';
import ChallengeDashboard from '@/components/challenge/ChallengeDashboard';

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
  useInactivityTimeout();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [waitlistData, setWaitlistData] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const fetchDashboardData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [waitlistRes, profileRes] = await Promise.all([
        supabase.rpc('get_my_waitlist_status'),
        supabase.from('profiles').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      if (waitlistRes.data && Array.isArray(waitlistRes.data) && waitlistRes.data.length > 0) {
        setWaitlistData(waitlistRes.data[0]);
      } else {
        setWaitlistData(null);
      }
      if (profileRes.data) setProfile(profileRes.data);
    } catch {
      // Silently handle errors
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!mounted) return;
      if (!session) { navigate('/login'); return; }
      setUser(session.user);
    };
    
    initAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (!session) { navigate('/login'); return; }
      setUser(session.user);
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchDashboardData(user.id);

    // Check for pending payment
    const checkPendingPayment = async () => {
      const pending = getPendingPayment();
      if (!pending) return;
      toast.loading('Checking for pending payment...');
      try {
        const { data: verifyResult, error } = await supabase.functions.invoke('verify-payment', {
          body: { reference: pending.reference, tier: pending.tier },
        });
        toast.dismiss();
        if (!error && verifyResult?.success) {
          toast.success(`🎉 Payment confirmed! Upgraded to ${pending.tier === 'founder' ? 'Founder Circle' : 'Priority Access'}!`);
          clearPendingPayment();
          fetchDashboardData(user.id);
        } else {
          clearPendingPayment();
        }
      } catch {
        toast.dismiss();
        clearPendingPayment();
      }
    };
    checkPendingPayment();

    // Realtime profile changes
    const channel = supabase
      .channel('profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `user_id=eq.${user.id}` }, (payload) => {
        setProfile((prev: any) => ({ ...prev, ...payload.new }));
        // Re-fetch waitlist data since tier change affects ranking
        fetchDashboardData(user.id);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchDashboardData]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handlePayment = (tierId: string) => {
    if (!user) return;
    const priceInfo = TIER_PRICES[tierId as keyof typeof TIER_PRICES];
    if (!priceInfo) return;

    openPaystackPopup({
      email: user.email || '',
      amount: priceInfo.amount,
      metadata: { tier: tierId, user_id: user.id },
      onSuccess: async (reference) => {
        toast.loading('Verifying payment...');
        try {
          const { data: verifyResult, error } = await supabase.functions.invoke('verify-payment', {
            body: { reference, tier: tierId },
          });
          toast.dismiss();
          if (error || !verifyResult?.success) {
            toast.error(verifyResult?.error || 'Payment verification failed. Please contact support.');
          } else {
            toast.success(`🎉 Upgraded to ${tierId === 'founder' ? 'Founder Circle' : 'Priority Access'}!`);
            fetchDashboardData(user.id);
          }
        } catch {
          toast.dismiss();
          toast.error('Payment verification failed. Please contact support.');
        }
      },
      onClose: () => {},
    });
  };

  const handleRequestDeletion = async () => {
    setDeleteLoading(true);
    const { error } = await supabase.rpc('request_account_deletion');
    if (error) {
      toast.error('Failed to request deletion: ' + error.message);
    } else {
      toast.success('Account deletion requested. Your data will be removed after 30 days.');
      setProfile((p: any) => ({ ...p, deleted_at: new Date().toISOString() }));
    }
    setDeleteLoading(false);
    setShowDeleteConfirm(false);
  };

  const handleCancelDeletion = async () => {
    const { error } = await supabase.rpc('cancel_account_deletion');
    if (error) {
      toast.error('Failed to cancel: ' + error.message);
    } else {
      toast.success('Account deletion cancelled.');
      setProfile((p: any) => ({ ...p, deleted_at: null }));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Loading your dashboard...</div>
      </div>
    );
  }

  const tier = profile?.tier || 'free';
  const isDeletionPending = !!profile?.deleted_at;

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-surface border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="font-heading font-bold text-lg text-foreground">GegoBooks</h1>
            <span className={`font-body text-xs font-medium px-3 py-1 rounded-full ${tierColors[tier]}`}>
              {tierLabels[tier]}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/')} className="font-body text-sm text-muted hover:text-foreground transition-colors">Home</button>
            <button onClick={handleSignOut} className="font-body text-sm text-muted hover:text-destructive transition-colors">Sign Out</button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        {isDeletionPending && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-body text-sm text-foreground font-medium">Account deletion in progress</p>
              <p className="font-body text-xs text-muted mt-1">
                Your account and data will be permanently deleted 30 days after your request ({new Date(profile.deleted_at).toLocaleDateString()}).
              </p>
              <button onClick={handleCancelDeletion} className="mt-2 font-body text-sm text-primary hover:underline font-medium">
                Cancel Deletion
              </button>
            </div>
          </div>
        )}

        {/* Waitlist Status */}
        <div className="bg-surface rounded-xl border border-border p-6">
          <h2 className="font-heading font-bold text-lg text-foreground mb-4">Your Waitlist Status</h2>
          {waitlistData ? (
            <>
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
              <p className="font-body text-xs text-muted mt-4 text-center">
                💡 Ranking priority: Founder Circle → Priority Access → Free Waitlist. Each referral moves you up within your tier.
              </p>
            </>
          ) : (
            <p className="font-body text-sm text-muted">
              No waitlist signup found for this email. Please{' '}
              <button onClick={() => navigate('/')} className="text-primary hover:underline">join the waitlist</button> first.
            </p>
          )}
        </div>

        {/* Upgrade Tier */}
        {tier !== 'founder' && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">Upgrade Your Access</h2>
            <p className="font-body text-sm text-muted mb-4">Skip the line with a paid tier. Paid tiers rank higher regardless of referrals.</p>
            <div className="grid md:grid-cols-2 gap-4">
              {tier === 'free' && (
                <button
                  onClick={() => handlePayment('priority')}
                  className="block bg-primary/5 border border-primary/20 rounded-lg p-4 hover:bg-primary/10 transition-colors text-left"
                >
                  <p className="font-heading font-bold text-foreground">Priority Waitlist</p>
                  <p className="font-body text-sm text-muted mt-1">$1 (₦1,500) — Jump the queue</p>
                </button>
              )}
              <button
                onClick={() => handlePayment('founder')}
                className="block bg-accent/5 border border-accent/20 rounded-lg p-4 hover:bg-accent/10 transition-colors text-left"
              >
                <p className="font-heading font-bold text-foreground">Founder Circle ⭐</p>
                <p className="font-body text-sm text-muted mt-1">$10 (₦15,000) — First access + perks</p>
              </button>
            </div>
          </div>
        )}

        {/* Referral Section - only for authenticated users with waitlist data */}
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

        {/* Creator Challenge */}
        {user && (
          <ChallengeDashboard user={user} waitlistData={waitlistData} />
        )}

        {/* Account Deletion */}
        {!isDeletionPending && (
          <div className="bg-surface rounded-xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg text-foreground mb-2">Delete Account</h2>
            <p className="font-body text-sm text-muted mb-4">
              Request permanent deletion of your account. Your data will be retained for 30 days per our privacy policy.
            </p>
            {showDeleteConfirm ? (
              <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <p className="font-body text-sm text-foreground font-medium mb-3">Are you sure? This will schedule your account for deletion.</p>
                <div className="flex gap-3">
                  <button onClick={handleRequestDeletion} disabled={deleteLoading} className="bg-destructive text-destructive-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:opacity-90 disabled:opacity-50">
                    {deleteLoading ? 'Processing...' : 'Yes, Delete My Account'}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="bg-muted/20 text-foreground font-body text-sm font-medium px-4 py-2 rounded-lg hover:bg-muted/30">Cancel</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setShowDeleteConfirm(true)} className="font-body text-sm text-destructive hover:underline font-medium">
                Request Account Deletion
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
