import React from 'react';
import { Address, DeliveryStatus, Priority } from '@shared/schema';
import { cn } from '@/lib/utils';
import { Clock, AlarmClock, Pencil, Trash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';

interface AddressListProps {
  addresses: Address[];
  isLoading: boolean;
  onEditAddress: (address: Address) => void;
  onDeleteAddress: (id: number) => void;
  routeStats?: {
    totalDistance: string;
    totalTime: string;
    totalFuel: string;
  };
  onStartRoute: () => void;
}

export function AddressList({ 
  addresses, 
  isLoading, 
  onEditAddress, 
  onDeleteAddress,
  routeStats,
  onStartRoute
}: AddressListProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <div className="h-6 w-36 bg-primary-100 animate-pulse rounded"></div>
          <div className="h-4 w-24 bg-primary-100 animate-pulse rounded"></div>
        </CardHeader>
        <CardContent className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="p-4 border-b border-primary-200">
              <div className="h-5 w-3/4 bg-primary-100 animate-pulse rounded mb-2"></div>
              <div className="h-4 w-1/2 bg-primary-100 animate-pulse rounded"></div>
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="p-4 border-b border-primary-200">
        <h2 className="text-lg font-semibold">Delivery Addresses</h2>
        <p className="text-sm text-primary-500">{addresses.length} addresses added</p>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="divide-y divide-primary-200">
          {addresses.length === 0 ? (
            <div className="p-8 text-center text-primary-500">
              <p>No addresses added yet.</p>
              <p className="text-sm mt-1">Add addresses using the form or import from CSV.</p>
            </div>
          ) : (
            addresses.map((address) => (
              <div 
                key={address.id} 
                className="p-4 hover:bg-primary-50 transition-colors flex justify-between items-center"
              >
                <div>
                  <h3 className="font-medium">{address.fullAddress}</h3>
                  <div className="flex items-center mt-1 flex-wrap gap-1">
                    <Badge variant="outline" className="bg-success-100 text-success-800 border-success-200">
                      <Clock className="mr-1 h-3 w-3" /> {address.timeWindow}
                    </Badge>
                    
                    {address.exactDeliveryTime && (
                      <Badge variant="outline" className="bg-warning-100 text-warning-800 border-warning-200 ml-1">
                        <AlarmClock className="mr-1 h-3 w-3" /> {address.exactDeliveryTime}
                      </Badge>
                    )}
                    
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "ml-2",
                        address.priority === Priority.HIGH 
                          ? "bg-warning-100 text-warning-800 border-warning-200" 
                          : address.priority === Priority.LOW
                            ? "bg-primary-100 text-primary-800 border-primary-200 opacity-80"
                            : "bg-primary-100 text-primary-800 border-primary-200"
                      )}
                    >
                      {address.priority} Priority
                    </Badge>
                    
                    {address.specialInstructions && (
                      <p className="text-sm text-primary-500 mt-1">{address.specialInstructions}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-primary-500 hover:text-primary-700"
                    onClick={() => onEditAddress(address)}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="text-destructive-500 hover:text-destructive-700"
                    onClick={() => onDeleteAddress(address.id)}
                  >
                    <Trash className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
      
      {addresses.length > 0 && (
        <CardFooter className="p-4 border-t border-primary-200 bg-primary-50">
          <div className="flex justify-between items-center w-full">
            {routeStats ? (
              <div>
                <p className="text-sm text-primary-600 font-medium">Estimated Route Details:</p>
                <div className="flex space-x-4 mt-1 text-sm">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                      <polyline points="9 22 9 12 15 12 15 22"></polyline>
                    </svg>
                    <span>{routeStats.totalDistance}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10"></circle>
                      <polyline points="12 6 12 12 16 14"></polyline>
                    </svg>
                    <span>{routeStats.totalTime}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M3 22h12"></path>
                      <path d="M7 10l3-3 3 3"></path>
                      <path d="M10 21V7"></path>
                      <path d="M18 10c0-4-1-8-5-8"></path>
                      <path d="M18 21a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"></path>
                    </svg>
                    <span>{routeStats.totalFuel}</span>
                  </div>
                </div>
              </div>
            ) : (
              <div></div>
            )}
            
            <Button onClick={onStartRoute} variant="default" className="bg-success-500 hover:bg-success-600">
              <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polygon points="5 3 19 12 5 21 5 3"></polygon>
              </svg>
              Start Route
            </Button>
          </div>
        </CardFooter>
      )}
    </Card>
  );
}
