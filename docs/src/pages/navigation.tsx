import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { TabNavigation } from '@/components/tab-navigation';
import { DeliveryMap } from '@/components/delivery-map';
import { useAddresses } from '@/hooks/use-addresses';
import { useRouteSettings, useRoutes } from '@/hooks/use-route';
import { geocodeAddress, calculateRoute } from '@/lib/map-service';
import { AddressWithCoordinates, RouteStep, Coordinates } from '@/lib/types';
import { Address, DeliveryStatus } from '@shared/schema';
import { AdBanner } from '@/components/ad-banner';
import { Button } from '@/components/ui/button';
import { 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  Phone, 
  AlertTriangle, 
  List, 
  Navigation2 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { toast } from '@/hooks/use-toast';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

const TABS = [
  { name: 'Plan Route', href: '/' },
  { name: 'Navigation', href: '/navigation' },
  { name: 'Summary', href: '/summary' },
];

export default function NavigationPage() {
  const [, navigate] = useLocation();
  const [currentAddressIndex, setCurrentAddressIndex] = useState(0);
  const [addressesWithCoordinates, setAddressesWithCoordinates] = useState<AddressWithCoordinates[]>([]);
  const [routePath, setRoutePath] = useState<{ 
    coordinates: [number, number][]; 
    steps?: RouteStep[];
    currentLocation?: Coordinates;
  } | undefined>();
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [showTurnByTurn, setShowTurnByTurn] = useState(false);
  const [fullScreenMap, setFullScreenMap] = useState(false);
  const [showRouteOverview, setShowRouteOverview] = useState(false);
  const [isNotDeliveredDialogOpen, setIsNotDeliveredDialogOpen] = useState(false);
  const [isAllStopsDialogOpen, setIsAllStopsDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Get addresses and route settings
  const { 
    addresses, 
    isLoadingAddresses, 
    updateAddressStatus, 
    isUpdatingAddressStatus 
  } = useAddresses();
  
  const { routeSettings } = useRouteSettings();
  
  const { 
    routes, 
    isLoadingRoutes,
    completeRoute,
    isCompletingRoute
  } = useRoutes();
  
  // Get current route (should be the latest non-completed route)
  const currentRoute = routes?.find(route => !route.completed);
  
  // Get current address
  const currentAddress = addresses[currentAddressIndex];
  
  // Calculate total addresses and progress
  const totalAddresses = addresses.length;
  const completedAddresses = addresses.filter(
    addr => addr.status === DeliveryStatus.DELIVERED || addr.status === DeliveryStatus.FAILED
  ).length;
  
  // Navigate to plan route if no addresses
  useEffect(() => {
    if (addresses.length === 0 && !isLoadingAddresses) {
      toast({
        title: "No route planned",
        description: "Please plan a route first.",
      });
      navigate('/');
    }
  }, [addresses, isLoadingAddresses, navigate]);
  
  // Get coordinates for addresses and calculate route
  useEffect(() => {
    const geocodeAddresses = async () => {
      if (addresses.length === 0) return;
      
      setIsLoading(true);
      try {
        console.log("Starting navigation with addresses:", addresses);
        
        // Geocode addresses that don't have lat/lng
        const geocodedAddresses: AddressWithCoordinates[] = [];
        
        for (const address of addresses) {
          // If we already have geocoded this address, use cached coordinates
          const existingAddress = addressesWithCoordinates.find(a => a.id === address.id);
          if (existingAddress) {
            geocodedAddresses.push(existingAddress);
            console.log(`Using cached coordinates for ${address.fullAddress}`);
            continue;
          }
          
          // Otherwise, geocode the address
          const coords = await geocodeAddress(address.fullAddress);
          if (coords) {
            geocodedAddresses.push({
              ...address,
              position: [coords.lat, coords.lng]
            });
            console.log(`Successfully geocoded ${address.fullAddress} to:`, coords);
          } else {
            console.error(`Could not geocode address: ${address.fullAddress}`);
          }
        }
        
        setAddressesWithCoordinates(geocodedAddresses);
        console.log(`Successfully geocoded ${geocodedAddresses.length} addresses`);
        
        // Calculate route if we have at least 1 address and route settings
        if (geocodedAddresses.length >= 1 && routeSettings) {
          try {
            console.log("Calculating route with user's current location");
            // Get the user's current location and calculate route from there
            const route = await calculateRoute(
              geocodedAddresses, 
              routeSettings,
              true // start from current location
            );
            
            if (route) {
              console.log("Route calculation successful:", route);
              
              // Immediately enable turn-by-turn directions
              setShowTurnByTurn(true);
              
              setRoutePath({
                coordinates: route.coordinates || [],
                steps: route.steps,
                currentLocation: route.currentLocation
              });
              
              // Reset active step index when route changes
              setActiveStepIndex(0);
              
              toast({
                title: "Navigation Ready",
                description: `Route optimized based on your current location. ${route.steps.length} turn-by-turn directions available.`,
              });
            }
          } catch (error) {
            console.error('Error calculating route with current location:', error);
            
            // Fall back to route without current location
            console.log("Falling back to route without current location");
            const fallbackRoute = await calculateRoute(geocodedAddresses, routeSettings);
            if (fallbackRoute) {
              setRoutePath({
                coordinates: fallbackRoute.coordinates || [],
                steps: fallbackRoute.steps
              });
            }
          }
        }
      } catch (error) {
        console.error('Error in navigation setup:', error);
        toast({
          title: "Navigation setup failed",
          description: (error as Error).message,
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    geocodeAddresses();
  }, [addresses, routeSettings]);
  
  // Mark current address as delivered
  const handleMarkDelivered = () => {
    if (!currentAddress) return;
    
    updateAddressStatus({
      id: currentAddress.id,
      status: DeliveryStatus.DELIVERED
    });
    
    // Move to next address if not at the end
    if (currentAddressIndex < totalAddresses - 1) {
      setCurrentAddressIndex(currentAddressIndex + 1);
    } else {
      // If all addresses are delivered/failed, mark route as complete
      const allAddressesProcessed = addresses.every(
        addr => addr.status === DeliveryStatus.DELIVERED || addr.status === DeliveryStatus.FAILED
      );
      
      if (allAddressesProcessed && currentRoute) {
        completeRoute(currentRoute.id);
        navigate('/summary');
      }
    }
  };
  
  // Mark current address as failed
  const handleMarkFailed = () => {
    if (!currentAddress) return;
    
    updateAddressStatus({
      id: currentAddress.id,
      status: DeliveryStatus.FAILED
    });
    
    setIsNotDeliveredDialogOpen(false);
    
    // Move to next address if not at the end
    if (currentAddressIndex < totalAddresses - 1) {
      setCurrentAddressIndex(currentAddressIndex + 1);
    } else {
      // If all addresses are delivered/failed, mark route as complete
      const allAddressesProcessed = addresses.every(
        addr => addr.status === DeliveryStatus.DELIVERED || addr.status === DeliveryStatus.FAILED
      );
      
      if (allAddressesProcessed && currentRoute) {
        completeRoute(currentRoute.id);
        navigate('/summary');
      }
    }
  };
  
  // Navigate to previous address
  const handlePrevious = () => {
    if (currentAddressIndex > 0) {
      setCurrentAddressIndex(currentAddressIndex - 1);
      
      // Enable turn-by-turn directions automatically
      setShowTurnByTurn(true);
      
      // Reset the active step index to 0 when navigating to a new address
      setActiveStepIndex(0);
      
      // Add a toast notification
      toast({
        title: "Navigating to previous address",
        description: `Now showing directions to ${addresses[currentAddressIndex - 1]?.fullAddress || 'previous location'}`,
      });
      
      // Disable route overview when navigating to a specific address
      setShowRouteOverview(false);
    }
  };
  
  // Navigate to next address
  const handleNext = () => {
    if (currentAddressIndex < totalAddresses - 1) {
      setCurrentAddressIndex(currentAddressIndex + 1);
      
      // Enable turn-by-turn directions automatically when moving to the next address
      setShowTurnByTurn(true);
      
      // Reset the active step index to 0 when navigating to a new address
      setActiveStepIndex(0);
      
      // Add a toast notification
      toast({
        title: "Navigating to next address",
        description: `Now showing directions to ${addresses[currentAddressIndex + 1]?.fullAddress || 'next location'}`,
      });
      
      // Set full screen mode for better visibility during navigation
      setFullScreenMap(true);
      
      // Disable route overview when navigating to a specific address
      setShowRouteOverview(false);
    }
  };
  
  // Switch to full-screen turn-by-turn navigation
  const handleOpenDirections = () => {
    if (!currentAddress) return;
    
    // Turn on both turn-by-turn mode and full screen
    setShowTurnByTurn(true);
    setFullScreenMap(true);
    
    toast({
      title: "Turn-by-Turn Navigation",
      description: "Follow the on-screen directions to your destination.",
    });
  };
  
  // Handle fake call button
  const handleCall = () => {
    toast({
      title: "Calling customer...",
      description: "This would initiate a call in a real app.",
    });
  };
  
  // Calculate ETA (fake implementation)
  const getETA = () => {
    return '12 min';
  };
  
  // Get traffic condition (fake implementation)
  const getTrafficCondition = () => {
    const conditions = ['Light traffic', 'Moderate traffic', 'Heavy traffic'];
    return conditions[Math.floor(Math.random() * conditions.length)];
  };
  
  // Toggle route overview
  const toggleRouteOverview = () => {
    setShowRouteOverview(!showRouteOverview);
    
    // If enabling overview, make sure we can see the whole map
    if (!showRouteOverview) {
      toast({
        title: "Route Overview",
        description: "Showing all stops on your route",
      });
    }
  };
  
  // Jump to a specific address
  const jumpToAddress = (index: number) => {
    setCurrentAddressIndex(index);
    setIsAllStopsDialogOpen(false);
    
    // Enable turn-by-turn directions automatically
    setShowTurnByTurn(true);
    
    // Reset the active step index to 0 when navigating to a new address
    setActiveStepIndex(0);
    
    // Add a toast notification
    toast({
      title: "Navigating to selected address",
      description: `Now showing directions to ${addresses[index]?.fullAddress || 'selected location'}`,
    });
    
    // Set full screen mode for better visibility during navigation
    setFullScreenMap(true);
    
    // Disable route overview when navigating to a specific address
    setShowRouteOverview(false);
  };
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <TabNavigation tabs={TABS} />
      
      {/* Non-intrusive ad banner */}
      <div className="bg-gray-50 border-b border-t border-gray-200">
        <div className="max-w-screen-lg mx-auto py-2 flex justify-center">
          <AdBanner 
            size="leaderboard" 
            adCode={`
              <!-- Your AdSense code here -->
              <ins class="adsbygoogle"
                style="display:inline-block;width:728px;height:90px"
                data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
                data-ad-slot="XXXXXXXXXX">
              </ins>
              <script>
                (adsbygoogle = window.adsbygoogle || []).push({});
              </script>
            `}
          />
        </div>
      </div>
      
      <main className="flex-1">
        <div className="h-[calc(100vh-120px)] relative">
          {/* Map with active navigation */}
          <div className="relative">
            <DeliveryMap
              addresses={addressesWithCoordinates}
              currentRoute={routePath}
              isLoading={isLoading}
              activeAddressId={currentAddress?.id}
              showActiveStepDirections={showTurnByTurn && !showRouteOverview}
              activeStepIndex={activeStepIndex}
              fullScreen={fullScreenMap}
              title={fullScreenMap ? (showRouteOverview ? "Route Overview" : "Live Navigation") : "Route Preview"}
              showRouteOverview={showRouteOverview}
            />
            
            {/* Floating Next Button in Top Right Corner */}
            {currentAddressIndex < totalAddresses - 1 && (
              <div className="absolute top-16 right-4 z-50">
                <Button 
                  variant="default"
                  className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full shadow-lg flex items-center"
                  onClick={handleNext}
                >
                  <span className="mr-2 text-lg">NEXT</span>
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>
          
          {/* Navigation Overlay */}
          {currentAddress && (
            <div className="absolute top-4 left-4 right-4">
              <Card className="bg-white rounded-lg shadow-lg p-4 mx-auto max-w-md">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="font-semibold">Next Delivery ({currentAddressIndex + 1} of {totalAddresses})</h2>
                  <span className="text-sm text-primary-500">ETA: {getETA()}</span>
                </div>
                
                <div className="bg-primary-50 rounded-md p-3 mb-3">
                  <h3 className="font-medium">{currentAddress.fullAddress}</h3>
                  <p className="text-sm text-primary-600 mt-1">
                    {currentAddress.priority} Priority • {currentAddress.timeWindow}
                  </p>
                  {currentAddress.specialInstructions && (
                    <p className="text-sm text-primary-600 mt-1">
                      Note: {currentAddress.specialInstructions}
                    </p>
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm mb-3">
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-primary-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 6H5a2 2 0 0 0-2 2v3a2 2 0 0 0 2 2h13l4-3.5L18 6Z"></path>
                      <path d="M12 13v9"></path>
                      <path d="M12 2v4"></path>
                    </svg>
                    <span>2.3 miles</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="h-4 w-4 mr-1 text-warning-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="4" height="16" x="6" y="4" rx="1"></rect>
                      <rect width="4" height="16" x="14" y="4" rx="1"></rect>
                    </svg>
                    <span>{getTrafficCondition()}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2">
                  <Button variant="outline" className="flex-1" onClick={handleCall}>
                    <Phone className="mr-2 h-4 w-4" /> Call
                  </Button>
                  <Button className="flex-1" onClick={handleOpenDirections}>
                    <Navigation2 className="mr-2 h-4 w-4" /> Directions
                  </Button>
                </div>
              </Card>
            </div>
          )}
          
          {/* Navigation Controls */}
          <div className="absolute bottom-4 left-4 right-4">
            <Card className="bg-white rounded-lg shadow-lg p-4 mx-auto max-w-md">
              {/* Prominent Next button at the top if we're not on the last address */}
              {currentAddressIndex < totalAddresses - 1 && (
                <Button 
                  variant="default"
                  className="w-full mb-3 bg-blue-500 hover:bg-blue-600 text-lg py-6 font-bold"
                  onClick={handleNext}
                >
                  <Navigation2 className="mr-2 h-5 w-5" /> 
                  NEXT: Navigate to {addresses[currentAddressIndex + 1]?.fullAddress || 'next address'}
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              )}
              
              <div className="grid grid-cols-3 gap-3">
                <Button variant="outline" onClick={handlePrevious} disabled={currentAddressIndex === 0}>
                  <ArrowLeft className="h-4 w-4" />
                </Button>
                <Button 
                  variant="default" 
                  className="bg-success-500 hover:bg-success-600"
                  onClick={handleMarkDelivered}
                  disabled={isUpdatingAddressStatus}
                >
                  <Check className="mr-2 h-4 w-4" /> Delivered
                </Button>
                <Button 
                  variant="default"
                  onClick={handleNext} 
                  disabled={currentAddressIndex === totalAddresses - 1}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="mt-3 grid grid-cols-2 gap-2">
                <Button variant="ghost" className="text-sm" onClick={() => setIsNotDeliveredDialogOpen(true)}>
                  <AlertTriangle className="mr-1 h-3 w-3" /> Not Delivered
                </Button>
                
                <Button variant="ghost" className="text-sm" onClick={() => setIsAllStopsDialogOpen(true)}>
                  <List className="mr-1 h-3 w-3" /> All Stops
                </Button>
                
                <Button 
                  variant={showTurnByTurn ? "default" : "outline"}
                  className={`text-sm ${showTurnByTurn ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                  onClick={() => setShowTurnByTurn(!showTurnByTurn)}
                >
                  <Navigation2 className="mr-1 h-3 w-3" />
                  {showTurnByTurn ? "Exit Turn-by-Turn" : "Start Turn-by-Turn"}
                </Button>
                
                <Button 
                  variant={fullScreenMap ? "default" : "outline"}
                  className={`text-sm ${fullScreenMap ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                  onClick={() => setFullScreenMap(!fullScreenMap)}
                >
                  <svg className="h-3 w-3 mr-1" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {fullScreenMap 
                      ? <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                      : <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                    }
                  </svg>
                  {fullScreenMap ? "Exit Full Screen" : "Full Screen"}
                </Button>
                
                {/* Route Overview Toggle Button (Similar to Google Maps example from screenshot) */}
                <Button 
                  variant={showRouteOverview ? "default" : "outline"}
                  className={`text-sm col-span-2 ${showRouteOverview ? "bg-blue-500 hover:bg-blue-600" : ""}`}
                  onClick={toggleRouteOverview}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3 w-3 mr-1">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                  </svg>
                  {showRouteOverview ? "Hide Full Route" : "Show Full Route"}
                </Button>
              </div>
              
              {showTurnByTurn && routePath?.steps && routePath.steps.length > 0 && (
                <div className="mt-3 flex justify-between items-center">
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStepIndex(Math.max(0, activeStepIndex - 1))}
                    disabled={activeStepIndex === 0}
                  >
                    <ArrowLeft className="h-3 w-3 mr-1" /> Prev Step
                  </Button>
                  
                  <span className="text-xs font-medium text-primary-700">
                    Step {activeStepIndex + 1} of {routePath.steps.length}
                  </span>
                  
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStepIndex(Math.min((routePath.steps?.length || 0) - 1, activeStepIndex + 1))}
                    disabled={activeStepIndex === (routePath.steps?.length || 0) - 1}
                  >
                    Next Step <ArrowRight className="h-3 w-3 ml-1" />
                  </Button>
                </div>
              )}
            </Card>
          </div>
        </div>
      </main>
      
      {/* Not Delivered Dialog */}
      <AlertDialog open={isNotDeliveredDialogOpen} onOpenChange={setIsNotDeliveredDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unable to Deliver?</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that you were unable to deliver this package. This will mark the stop as "Failed".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleMarkFailed}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Mark as Failed
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* All Stops Dialog */}
      <Dialog open={isAllStopsDialogOpen} onOpenChange={setIsAllStopsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>All Delivery Stops</DialogTitle>
            <DialogDescription>
              Click on a stop to navigate directly to it.
            </DialogDescription>
          </DialogHeader>
          
          <div className="max-h-80 overflow-y-auto divide-y divide-primary-200">
            {addresses.map((address, index) => (
              <div 
                key={address.id} 
                className={`p-3 ${
                  index === currentAddressIndex 
                    ? 'bg-primary-100' 
                    : 'hover:bg-primary-50'
                } cursor-pointer`}
                onClick={() => jumpToAddress(index)}
              >
                <div className="flex items-center">
                  <div className="h-6 w-6 rounded-full bg-primary-900 text-white flex items-center justify-center mr-2">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{address.fullAddress}</p>
                    <p className="text-xs text-primary-500">
                      {address.status === DeliveryStatus.DELIVERED 
                        ? '✓ Delivered' 
                        : address.status === DeliveryStatus.FAILED 
                          ? '✗ Failed' 
                          : 'Pending'}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAllStopsDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
