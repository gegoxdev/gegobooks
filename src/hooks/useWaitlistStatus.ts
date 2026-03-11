import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface WaitlistStatus {
  isLoggedIn: boolean;
  isOnWaitlist: boolean;
  isReady: boolean;
  waitlistData: {
    full_name: string;
    email: string;
    waitlist_position: number;
    referrals_count: number;
    referral_code: string;
    user_type: string;
  } | null;
}

export function useWaitlistStatus(): WaitlistStatus {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isOnWaitlist, setIsOnWaitlist] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [waitlistData, setWaitlistData] = useState<WaitlistStatus['waitlistData']>(null);

  const fetchWaitlistData = useCallback(async () => {
    try {
      const { data } = await supabase.rpc('get_my_waitlist_status');
      if (data && Array.isArray(data) && data.length > 0) {
        setIsOnWaitlist(true);
        const row = data[0] as any;
        setWaitlistData({
          full_name: row.full_name,
          email: row.email,
          waitlist_position: row.waitlist_position,
          referrals_count: row.referrals_count,
          referral_code: row.referral_code,
          user_type: row.user_type,
        });
      } else {
        setIsOnWaitlist(false);
        setWaitlistData(null);
      }
    } catch {
      setIsOnWaitlist(false);
      setWaitlistData(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      // Force session refresh to avoid stale tokens
      const { data: { session }, error } = await supabase.auth.getSession();
      if (!mounted) return;
      
      if (!session || error) {
        setIsLoggedIn(false);
        setIsOnWaitlist(false);
        setWaitlistData(null);
        setIsReady(true);
        return;
      }
      setIsLoggedIn(true);
      await fetchWaitlistData();
      if (mounted) setIsReady(true);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      if (!session) {
        setIsLoggedIn(false);
        setIsOnWaitlist(false);
        setWaitlistData(null);
        setIsReady(true);
      } else {
        setIsLoggedIn(true);
        await fetchWaitlistData();
        if (mounted) setIsReady(true);
      }
    });

    // Also listen for profile changes (tier upgrades affect position)
    const profileChannel = supabase
      .channel('waitlist-profile-changes')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles' }, () => {
        if (mounted) fetchWaitlistData();
      })
      .subscribe();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      supabase.removeChannel(profileChannel);
    };
  }, [fetchWaitlistData]);

  return { isLoggedIn, isOnWaitlist, isReady, waitlistData };
}
