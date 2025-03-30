import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';

interface AdBannerProps {
  size: 'leaderboard' | 'rectangle' | 'skyscraper';
  className?: string;
  adCode?: string; // Optional direct AdSense code
}

/**
 * A component to display an advertisement banner.
 * This component can either use a placeholder or real AdSense code.
 */
export function AdBanner({ size, className = '', adCode }: AdBannerProps) {
  const adContainerRef = useRef<HTMLDivElement>(null);
  const [isAdLoaded, setIsAdLoaded] = useState(false);
  
  // Sizes based on standard ad units
  const dimensions = {
    leaderboard: { width: '728px', height: '90px' },
    rectangle: { width: '300px', height: '250px' },
    skyscraper: { width: '160px', height: '600px' }
  };
  
  const { width, height } = dimensions[size];
  
  useEffect(() => {
    // Only load the script once
    if (!document.getElementById('google-adsense-script') && adCode) {
      const script = document.createElement('script');
      script.id = 'google-adsense-script';
      script.async = true;
      script.src = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js';
      script.crossOrigin = 'anonymous';
      
      script.onload = () => {
        console.log('AdSense script loaded successfully');
        // After script loads, we can add the ad code
        injectAdCode();
      };
      
      script.onerror = () => {
        console.error('Failed to load AdSense script');
        setIsAdLoaded(false);
      };
      
      document.head.appendChild(script);
    } else if (adCode) {
      // If script already exists, just add the ad code
      injectAdCode();
    } else {
      console.log('Ad banner mounted - showing placeholder since no ad code provided');
    }
    
    return () => {
      // Cleanup if needed
    };
  }, [adCode]);
  
  const injectAdCode = () => {
    if (adContainerRef.current && adCode) {
      try {
        // Clear existing content
        adContainerRef.current.innerHTML = '';
        
        // Create a container for the ad code
        const adContainer = document.createElement('div');
        adContainer.innerHTML = adCode;
        
        // Append all children to our ref
        while (adContainer.firstChild) {
          adContainerRef.current.appendChild(adContainer.firstChild);
        }
        
        // Try to initialize any (adsbygoogle) objects
        try {
          if (window.adsbygoogle) {
            window.adsbygoogle.push({});
          }
        } catch (err) {
          console.error('Error initializing adsbygoogle:', err);
        }
        
        setIsAdLoaded(true);
        console.log('Ad code injected successfully');
      } catch (err) {
        console.error('Error injecting ad code:', err);
        setIsAdLoaded(false);
      }
    }
  };
  
  // If no ad code is provided, show a placeholder
  if (!adCode) {
    return (
      <Card className={`bg-primary-50 flex items-center justify-center ${className}`}
        style={{ width, height, maxWidth: '100%' }}>
        <div className="text-center">
          <p className="text-xs text-primary-400">Advertisement</p>
          <p className="text-primary-500 text-sm">Your ad could be here</p>
          <p className="text-xs text-primary-400 mt-1">Powered by DeliveryNav</p>
        </div>
      </Card>
    );
  }
  
  // Container for real ad
  return (
    <div 
      ref={adContainerRef} 
      className={className}
      style={{ width, height, maxWidth: '100%', overflow: 'hidden' }}
    />
  );
}

// Declare adsbygoogle for TypeScript
declare global {
  interface Window {
    adsbygoogle: any[];
  }
}