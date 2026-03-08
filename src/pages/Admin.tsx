import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import AdminLogin from '@/components/admin/AdminLogin';
import AdminHeader from '@/components/admin/AdminHeader';
import AfricaMap from '@/components/admin/AfricaMap';
import MetricsBar from '@/components/admin/MetricsBar';
import GrowthComparisons from '@/components/admin/GrowthComparisons';
import SignupGrowthChart from '@/components/admin/SignupGrowthChart';
import UserTypeBreakdown from '@/components/admin/UserTypeBreakdown';
import ReferralLeaderboard from '@/components/admin/ReferralLeaderboard';
import WaitlistProjection from '@/components/admin/WaitlistProjection';
import SignupsTable from '@/components/admin/SignupsTable';
import UserAccountStats from '@/components/admin/UserAccountStats';

const Admin = () => {
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkAdmin(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });
  }, []);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('admin_users').select('id').eq('user_id', userId).maybeSingle();
    if (data) {
      setAuthed(true);
    }
    setAuthLoading(false);
  };

  const handleLoginSuccess = (userId: string) => {
    checkAdmin(userId);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setAuthed(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse font-body text-muted">Loading...</div>
      </div>
    );
  }

  if (!authed) {
    return <AdminLogin onSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onSignOut={handleSignOut} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        <AfricaMap />
        <MetricsBar />
        <GrowthComparisons />
        <SignupGrowthChart />
        <div className="grid md:grid-cols-2 gap-6">
          <UserTypeBreakdown />
          <ReferralLeaderboard />
        </div>
        <WaitlistProjection />
        <SignupsTable />
      </div>
    </div>
  );
};

export default Admin;
