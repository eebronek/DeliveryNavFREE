import React from 'react';
import { Link, useLocation } from 'wouter';
import { Settings, User, Navigation } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <a className="text-primary-900 text-xl font-bold">DeliveryNav</a>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Link href="/navigation">
            <Button variant="default" size="sm" className="flex items-center gap-2">
              <Navigation className="h-4 w-4" />
              <span>Start Navigation</span>
            </Button>
          </Link>
          
          <Link href="/settings">
            <Button variant="ghost" size="icon">
              <Settings className="h-5 w-5" />
              <span className="sr-only">Settings</span>
            </Button>
          </Link>
          
          <Link href="/profile">
            <Button variant="ghost" size="icon">
              <User className="h-5 w-5" />
              <span className="sr-only">Profile</span>
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
