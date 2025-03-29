import React from 'react';
import { Link, useLocation } from 'wouter';
import { Settings, User } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function Header() {
  const [location] = useLocation();

  return (
    <header className="sticky top-0 z-50 border-b border-primary-200 bg-white">
      <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Link href="/">
            <a className="text-primary-900 text-xl font-bold">DeliveryNav</a>
          </Link>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/settings">
              <a>
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </a>
            </Link>
          </Button>
          
          <Button variant="ghost" size="icon" asChild>
            <Link href="/profile">
              <a>
                <User className="h-5 w-5" />
                <span className="sr-only">Profile</span>
              </a>
            </Link>
          </Button>
        </div>
      </div>
    </header>
  );
}
