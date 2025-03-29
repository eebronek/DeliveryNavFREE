import React, { useState, useEffect } from 'react';
import { useLocation, useRoute } from 'wouter';
import { TabNavigation } from '@/components/tab-navigation';
import { Header } from '@/components/layout/header';
import { AddressForm } from '@/components/address-form';
import { AddressList } from '@/components/address-list';
import { DeliveryMap } from '@/components/delivery-map';
import { CSVImport } from '@/components/csv-import';
import { RouteSettingsForm } from '@/components/route-settings';
import { useAddresses } from '@/hooks/use-addresses';
import { useRouteSettings, useRoutes } from '@/hooks/use-route';
import { Address, InsertAddress, RouteSettings } from '@shared/schema';
import { AddressWithCoordinates } from '@/lib/types';
import { 
  calculateRoute, 
  geocodeAddress 
} from '@/lib/map-service';
import { 
  Dialog, 
  DialogContent, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from '@/hooks/use-toast';
import { Loader } from 'lucide-react';

const TABS = [
  { name: 'Plan Route', href: '/' },
  { name: 'Navigation', href: '/navigation' },
  { name: 'Summary', href: '/summary' },
];

export default function PlanRoute() {
  const [, navigate] = useLocation();
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [addressesWithCoordinates, setAddressesWithCoordinates] = useState<AddressWithCoordinates[]>([]);
  const [routePath, setRoutePath] = useState<{ coordinates: [number, number][] } | undefined>();
  const [routeStats, setRouteStats] = useState<{ totalDistance: string; totalTime: string; totalFuel: string; } | undefined>();
  const [isOptimizing, setIsOptimizing] = useState(false);

  // Fetch addresses and route settings
  const { 
    addresses, 
    isLoadingAddresses, 
    createAddress, 
    isCreatingAddress, 
    updateAddress, 
    isUpdatingAddress, 
    deleteAddress, 
    isDeletingAddress,
    bulkAddAddresses,
    isBulkAddingAddresses
  } = useAddresses();

  const { 
    routeSettings, 
    isLoadingRouteSettings, 
    updateRouteSettings, 
    isUpdatingRouteSettings 
  } = useRouteSettings();

  const {
    createRoute,
    isCreatingRoute,
    optimizeRoute,
    isOptimizingRoute
  } = useRoutes();

  // Convert addresses to addressesWithCoordinates when addresses change
  useEffect(() => {
    const geocodeAddresses = async () => {
      if (addresses.length === 0) {
        setAddressesWithCoordinates([]);
        setRoutePath(undefined);
        setRouteStats(undefined);
        return;
      }

      // Geocode addresses that don't have lat/lng
      const geocodedAddresses: AddressWithCoordinates[] = [];
      
      for (const address of addresses) {
        // If we already have geocoded this address, use cached coordinates
        const existingAddress = addressesWithCoordinates.find(a => a.id === address.id);
        if (existingAddress) {
          geocodedAddresses.push(existingAddress);
          continue;
        }
        
        // Otherwise, geocode the address
        try {
          const coords = await geocodeAddress(address.fullAddress);
          if (coords) {
            geocodedAddresses.push({
              ...address,
              position: [coords.lat, coords.lng]
            });
          } else {
            // If geocoding fails, push address without coordinates
            console.warn(`Failed to geocode address: ${address.fullAddress}`);
            toast({
              title: "Geocoding failed",
              description: `Could not find coordinates for: ${address.fullAddress}`,
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error(`Error geocoding address: ${address.fullAddress}`, error);
        }
      }
      
      setAddressesWithCoordinates(geocodedAddresses);

      // Only calculate route if we have at least 2 addresses
      if (geocodedAddresses.length >= 2 && routeSettings) {
        try {
          setIsOptimizing(true);
          const route = await calculateRoute(geocodedAddresses, routeSettings);
          
          if (route) {
            // Get coordinates for route path
            const coordinates = route.waypoints.map(wp => [wp.position[1], wp.position[0]] as [number, number]);
            setRoutePath({ coordinates });
            setRouteStats({
              totalDistance: route.totalDistance,
              totalTime: route.totalDuration,
              totalFuel: route.totalFuel
            });
          }
        } catch (error) {
          console.error('Error calculating route:', error);
          toast({
            title: "Route calculation failed",
            description: (error as Error).message,
            variant: "destructive",
          });
        } finally {
          setIsOptimizing(false);
        }
      }
    };

    geocodeAddresses();
  }, [addresses, routeSettings]);

  const handleAddAddress = async (data: InsertAddress) => {
    createAddress(data);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddress(address);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAddress = (data: Partial<Address>) => {
    if (!editingAddress) return;
    
    updateAddress({
      id: editingAddress.id,
      data: data as Partial<Address>
    });
    
    setIsEditDialogOpen(false);
    setEditingAddress(null);
  };

  const handleDeleteAddress = (id: number) => {
    deleteAddress(id);
  };

  const handleBulkImport = (addresses: InsertAddress[]) => {
    bulkAddAddresses(addresses);
  };

  const handleStartRoute = () => {
    if (addresses.length < 2) {
      toast({
        title: "Not enough addresses",
        description: "Add at least two addresses to start a route.",
        variant: "destructive",
      });
      return;
    }
    
    if (routeStats) {
      // Create route record
      createRoute({
        totalDistance: routeStats.totalDistance,
        totalTime: routeStats.totalTime,
        fuelUsed: routeStats.totalFuel,
        completed: false
      });
      
      // Navigate to navigation view
      navigate('/navigation');
    } else {
      toast({
        title: "Route not calculated",
        description: "Please wait for route calculation to complete.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <TabNavigation tabs={TABS} />
      
      <main className="flex-1">
        <div className="container mx-auto px-4 sm:px-6 py-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Address Input Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-lg border border-primary-200 shadow-sm overflow-hidden p-4">
                <h2 className="text-lg font-semibold mb-4">Add Delivery Addresses</h2>
                
                <AddressForm 
                  onSubmit={handleAddAddress}
                  isSubmitting={isCreatingAddress}
                />
                
                <div className="flex items-center my-4">
                  <div className="flex-grow h-px bg-primary-200"></div>
                  <p className="mx-4 text-sm text-primary-500">OR</p>
                  <div className="flex-grow h-px bg-primary-200"></div>
                </div>
                
                <CSVImport 
                  onImport={handleBulkImport} 
                  isImporting={isBulkAddingAddresses}
                />
              </div>
              
              <RouteSettingsForm 
                onSubmit={updateRouteSettings}
                isSubmitting={isUpdatingRouteSettings}
                defaultValues={routeSettings}
              />
            </div>
            
            {/* Map and Address List Section */}
            <div className="lg:col-span-2 space-y-6">
              <AddressList 
                addresses={addresses}
                isLoading={isLoadingAddresses}
                onEditAddress={handleEditAddress}
                onDeleteAddress={handleDeleteAddress}
                routeStats={routeStats}
                onStartRoute={handleStartRoute}
              />
              
              <DeliveryMap 
                addresses={addressesWithCoordinates}
                currentRoute={routePath}
                isLoading={isOptimizing}
              />
            </div>
          </div>
        </div>
      </main>
      
      {/* Edit Address Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Delivery Address</DialogTitle>
          </DialogHeader>
          
          {editingAddress && (
            <AddressForm 
              onSubmit={handleUpdateAddress}
              isSubmitting={isUpdatingAddress}
              defaultValues={{
                fullAddress: editingAddress.fullAddress,
                timeWindow: editingAddress.timeWindow,
                priority: editingAddress.priority,
                specialInstructions: editingAddress.specialInstructions || '',
              }}
            />
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
