import { useState, useEffect } from 'react';
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

  useEffect(() => {
    const check = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setIsLoggedIn(false);
        setIsOnWaitlist(false);
        setWaitlistData(null);
        setIsReady(true);
        return;
      }
      setIsLoggedIn(true);

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
      setIsReady(true);
    };

    check();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        setIsLoggedIn(false);
        setIsOnWaitlist(false);
        setWaitlistData(null);
        setIsReady(true);
      } else {
        check();
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  return { isLoggedIn, isOnWaitlist, isReady, waitlistData };
}
