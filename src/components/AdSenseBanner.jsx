import React, { useEffect } from 'react';

/**
 * AdSenseBanner component for manual ad slots.
 *
 * Usage:
 * <AdSenseBanner slot="1234567890" format="auto" responsive="true" />
 */
export default function AdSenseBanner({
  client = 'ca-pub-9255875492059408',
  slot,
  format = 'auto',
  responsive = 'true',
  style = { display: 'block' },
  className = '',
}) {
  useEffect(() => {
    try {
      if (typeof window !== 'undefined' && window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (err) {
      console.warn('AdSense load error:', err);
    }
  }, []);

  return (
    <div className={`adsense-wrapper overflow-hidden text-center my-4 ${className}`}>
      <ins
        className="adsbygoogle"
        style={style}
        data-ad-client={client}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
