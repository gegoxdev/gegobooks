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
import AdminManagement from '@/components/admin/AdminManagement';
import ViewerLinkManager from '@/components/admin/ViewerLinkManager';
import ViewerDashboard from '@/components/admin/ViewerDashboard';
import InvestorMetrics from '@/components/admin/InvestorMetrics';
import WebsiteAnalytics from '@/components/admin/WebsiteAnalytics';
import { useInactivityTimeout } from '@/hooks/useInactivityTimeout';

type AdminRole = 'readonly' | 'approver' | 'admin' | 'master';

const Admin = () => {
  useInactivityTimeout();
  const [authed, setAuthed] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminRole, setAdminRole] = useState<AdminRole>('readonly');

  const urlParams = new URLSearchParams(window.location.search);
  const viewerToken = urlParams.get('viewer');

  useEffect(() => {
    if (viewerToken) {
      setAuthLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        checkAdmin(session.user.id);
      } else {
        setAuthLoading(false);
      }
    });
  }, [viewerToken]);

  const checkAdmin = async (userId: string) => {
    const { data } = await supabase.from('admin_users').select('id, role').eq('user_id', userId).maybeSingle();
    if (data) {
      setAuthed(true);
      setAdminRole(((data as any).role || 'readonly') as AdminRole);
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

  // Viewer mode — no auth required
  if (viewerToken) {
    return <ViewerDashboard token={viewerToken} />;
  }

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

  const isReadOnly = adminRole === 'readonly';
  const isMaster = adminRole === 'master';

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader onSignOut={handleSignOut} />
      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {(isMaster || adminRole === 'approver') && <AdminManagement currentRole={adminRole} />}
        {isMaster && <ViewerLinkManager />}
        <AfricaMap />
        <UserAccountStats isReadOnly={isReadOnly} />
        <MetricsBar />
        <InvestorMetrics />
        <GrowthComparisons />
        <SignupGrowthChart />
        <div className="grid md:grid-cols-2 gap-6">
          <UserTypeBreakdown />
          <ReferralLeaderboard />
        </div>
        <WaitlistProjection />
        <SignupsTable isReadOnly={isReadOnly} />
      </div>
    </div>
  );
};

export default Admin;
