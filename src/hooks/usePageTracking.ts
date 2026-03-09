import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

function getVisitorId(): string {
  let id = localStorage.getItem('gego_visitor_id');
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem('gego_visitor_id', id);
  }
  return id;
}

function getSessionId(): string {
  let id = sessionStorage.getItem('gego_session_id');
  if (!id) {
    id = crypto.randomUUID();
    sessionStorage.setItem('gego_session_id', id);
  }
  return id;
}

function parseUserAgent(ua: string) {
  let browser = 'Other';
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('Edg')) browser = 'Edge';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';

  let os = 'Other';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Mac')) os = 'macOS';
  else if (ua.includes('Linux') && !ua.includes('Android')) os = 'Linux';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad')) os = 'iOS';

  const width = window.innerWidth;
  let device_type = 'Desktop';
  if (width < 768) device_type = 'Mobile';
  else if (width < 1024) device_type = 'Tablet';

  return { browser, os, device_type };
}

export function usePageTracking() {
  const location = useLocation();
  const pageViewIdRef = useRef<string | null>(null);
  const enteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    // Skip tracking for admin routes
    if (location.pathname.startsWith('/admin')) return;

    const visitorId = getVisitorId();
    const sessionId = getSessionId();
    const ua = navigator.userAgent;
    const { browser, os, device_type } = parseUserAgent(ua);

    enteredAtRef.current = Date.now();
    pageViewIdRef.current = null;

    const trackPageView = async () => {
      const { data } = await supabase
        .from('page_views')
        .insert({
          visitor_id: visitorId,
          session_id: sessionId,
          page_path: location.pathname,
          referrer: document.referrer || null,
          utm_source: new URLSearchParams(location.search).get('utm_source') || null,
          utm_medium: new URLSearchParams(location.search).get('utm_medium') || null,
          utm_campaign: new URLSearchParams(location.search).get('utm_campaign') || null,
          user_agent: ua,
          screen_width: window.innerWidth,
          screen_height: window.innerHeight,
          device_type,
          browser,
          os,
        } as any)
        .select('id')
        .single();

      if (data) {
        pageViewIdRef.current = (data as any).id;
      }
    };

    trackPageView();

    // Update duration on page leave
    const updateDuration = () => {
      if (pageViewIdRef.current) {
        const duration = Date.now() - enteredAtRef.current;
        // Use sendBeacon for reliability on page unload
        const url = `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/rpc/update_page_view_duration`;
        const body = JSON.stringify({
          p_id: pageViewIdRef.current,
          p_duration_ms: duration,
        });
        navigator.sendBeacon(
          url,
          new Blob([body], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('beforeunload', updateDuration);

    return () => {
      // Update duration when navigating away within the SPA
      if (pageViewIdRef.current) {
        const duration = Date.now() - enteredAtRef.current;
        supabase.rpc('update_page_view_duration', {
          p_id: pageViewIdRef.current,
          p_duration_ms: duration,
        });
      }
      window.removeEventListener('beforeunload', updateDuration);
    };
  }, [location.pathname]);
}
