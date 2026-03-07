import { useState, useEffect } from 'react';

export const useUtmParams = () => {
  const [params, setParams] = useState({
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    ref: '',
  });

  useEffect(() => {
    const p = new URLSearchParams(window.location.search);
    setParams({
      utm_source: p.get('utm_source') || '',
      utm_medium: p.get('utm_medium') || '',
      utm_campaign: p.get('utm_campaign') || '',
      ref: p.get('ref') || '',
    });
  }, []);

  return params;
};
