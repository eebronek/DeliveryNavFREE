import React from 'react';
import { useLocation, Link } from 'wouter';
import { cn } from '@/lib/utils';

interface TabNavigationProps {
  tabs: {
    name: string;
    href: string;
  }[];
}

export function TabNavigation({ tabs }: TabNavigationProps) {
  const [location] = useLocation();

  return (
    <div className="bg-white border-b border-primary-200">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <Link key={tab.href} href={tab.href}>
              <a 
                className={cn(
                  "relative px-3 py-2 text-sm font-medium transition-colors",
                  location === tab.href 
                    ? "text-primary-900 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-primary-900" 
                    : "text-primary-500 hover:text-primary-900"
                )}
              >
                {tab.name}
              </a>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
