import React, { useEffect } from 'react';
import { Card } from '@/components/ui/card';

interface AdBannerProps {
  size: 'leaderboard' | 'rectangle' | 'skyscraper';
  className?: string;
}

/**
 * A component to display an advertisement banner.
 * In production, this would integrate with Google AdSense.
 */
export function AdBanner({ size, className = '' }: AdBannerProps) {
  // Sizes based on standard ad units
  const dimensions = {
    leaderboard: { width: '728px', height: '90px' },
    rectangle: { width: '300px', height: '250px' },
    skyscraper: { width: '160px', height: '600px' }
  };
  
  const { width, height } = dimensions[size];
  
  useEffect(() => {
    // In a real implementation, this would load the AdSense script
    // and initialize the ad unit
    console.log('Ad banner mounted - in production would load AdSense');
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
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