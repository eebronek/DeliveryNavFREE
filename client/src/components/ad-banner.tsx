import { useRef, useEffect, useState } from 'react';
import { Card } from './ui/card';

interface AdBannerProps {
  size: 'leaderboard' | 'rectangle' | 'skyscraper';
  className?: string;
  adCode?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export function AdBanner({ size, className = '', adCode }: AdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);

  const dimensions = {
    leaderboard: { width: '728px', height: '90px' },
    rectangle: { width: '300px', height: '250px' },
    skyscraper: { width: '160px', height: '600px' }
  };

  const { width, height } = dimensions[size];

  useEffect(() => {
    if (!process.env.ADSENSE_CLIENT_ID || !process.env.ADSENSE_AD_SLOT) {
      console.log('AdSense credentials not configured');
      return;
    }

    if (!document.getElementById('google-adsense-script')) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.setAttribute('data-ad-client', process.env.ADSENSE_CLIENT_ID);

      script.onload = () => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          setIsAdLoaded(true);
        } catch (err) {
          console.error('AdSense push error:', err);
        }
      };

      document.head.appendChild(script);
    }
  }, []);

  if (!process.env.ADSENSE_CLIENT_ID || !process.env.ADSENSE_AD_SLOT) {
    return (
      <Card className={`flex items-center justify-center ${className}`} style={{ width, height }}>
        <div className="text-center p-4">
          <p className="text-sm text-gray-500">Advertisement</p>
          <p className="text-xs text-primary-400 mt-1">Powered by DeliveryNav</p>
        </div>
      </Card>
    );
  }

  return (
    <ins
      className={`adsbygoogle ${className}`}
      style={{ display: 'block', width, height }}
      data-ad-client={process.env.ADSENSE_CLIENT_ID}
      data-ad-slot={process.env.ADSENSE_AD_SLOT}
      data-ad-format="auto"
      data-full-width-responsive="true"
    />
  );
}