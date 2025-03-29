declare module 'react-adsense' {
  import React from 'react';
  
  interface GoogleAdSenseProps {
    client: string;
    slot: string;
    className?: string;
    style?: React.CSSProperties;
    format?: string;
    responsive?: string;
    layoutKey?: string;
  }
  
  const AdSense: {
    Google: React.FC<GoogleAdSenseProps>;
  };
  
  export default AdSense;
}