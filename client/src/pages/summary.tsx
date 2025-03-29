import React from 'react';
import { useLocation } from 'wouter';
import { Header } from '@/components/layout/header';
import { TabNavigation } from '@/components/tab-navigation';
import { useAddresses } from '@/hooks/use-addresses';
import { useRoutes } from '@/hooks/use-route';
import { DeliveryStatus } from '@shared/schema';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardFooter, 
  CardHeader 
} from '@/components/ui/card';
import { 
  FileDown, 
  FilePdf, 
  Plus, 
  Clock, 
  Route, 
  Fuel 
} from 'lucide-react';
import { format } from 'date-fns';
import { DeliveryMap } from '@/components/delivery-map';
import { toast } from '@/hooks/use-toast';

const TABS = [
  { name: 'Plan Route', href: '/' },
  { name: 'Navigation', href: '/navigation' },
  { name: 'Summary', href: '/summary' },
];

export default function SummaryPage() {
  const [, navigate] = useLocation();
  
  // Get addresses and routes
  const { addresses, isLoadingAddresses } = useAddresses();
  const { routes, isLoadingRoutes } = useRoutes();
  
  // Get the most recent completed route
  const completedRoute = routes?.find(route => route.completed);
  
  // Calculate delivery stats
  const totalDeliveries = addresses.length;
  const successfulDeliveries = addresses.filter(a => a.status === DeliveryStatus.DELIVERED).length;
  const failedDeliveries = addresses.filter(a => a.status === DeliveryStatus.FAILED).length;
  
  // Format date for display
  const getFormattedDate = () => {
    if (completedRoute?.createdAt) {
      return format(new Date(completedRoute.createdAt), 'MMMM d, yyyy');
    }
    return format(new Date(), 'MMMM d, yyyy');
  };
  
  // Handle CSV export (placeholder)
  const handleExportCSV = () => {
    toast({
      title: "Export CSV",
      description: "This would export the route data as CSV in a real app.",
    });
  };
  
  // Handle PDF export (placeholder)
  const handleExportPDF = () => {
    toast({
      title: "Export PDF",
      description: "This would export the route data as PDF in a real app.",
    });
  };
  
  // Handle new route button
  const handleNewRoute = () => {
    navigate('/');
  };
  
  // Loading state
  if (isLoadingAddresses || isLoadingRoutes) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <TabNavigation tabs={TABS} />
        <main className="flex-1 container mx-auto px-4 sm:px-6 py-6">
          <Card className="animate-pulse">
            <CardHeader className="p-4 space-y-2">
              <div className="h-6 w-36 bg-primary-100 rounded"></div>
              <div className="h-4 w-24 bg-primary-100 rounded"></div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="h-20 bg-primary-100 rounded"></div>
                  ))}
                </div>
                <div className="h-60 bg-primary-100 rounded"></div>
                <div className="h-40 bg-primary-100 rounded"></div>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  // No completed route state
  if (!completedRoute || addresses.length === 0) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <TabNavigation tabs={TABS} />
        <main className="flex-1 container mx-auto px-4 sm:px-6 py-6">
          <Card>
            <CardContent className="p-10 text-center">
              <h2 className="text-xl font-semibold mb-2">No Completed Routes</h2>
              <p className="text-primary-500 mb-6">You haven't completed any delivery routes yet.</p>
              <Button onClick={handleNewRoute}>
                <Plus className="mr-2 h-4 w-4" /> Create New Route
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <TabNavigation tabs={TABS} />
      
      <main className="flex-1 container mx-auto px-4 sm:px-6 py-6">
        <Card className="mb-6">
          <CardHeader className="p-4 border-b border-primary-200">
            <h2 className="text-lg font-semibold">Route Summary</h2>
            <p className="text-sm text-primary-500">{getFormattedDate()}</p>
          </CardHeader>
          
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card className="p-4 bg-primary-50">
                <h3 className="text-sm font-medium text-primary-500 mb-1">Total Distance</h3>
                <p className="text-2xl font-semibold flex items-center">
                  <Route className="mr-2 h-5 w-5 text-primary-700" />
                  {completedRoute.totalDistance || '0 miles'}
                </p>
              </Card>
              
              <Card className="p-4 bg-primary-50">
                <h3 className="text-sm font-medium text-primary-500 mb-1">Total Time</h3>
                <p className="text-2xl font-semibold flex items-center">
                  <Clock className="mr-2 h-5 w-5 text-primary-700" />
                  {completedRoute.totalTime || '0h 0m'}
                </p>
              </Card>
              
              <Card className="p-4 bg-primary-50">
                <h3 className="text-sm font-medium text-primary-500 mb-1">Fuel Used</h3>
                <p className="text-2xl font-semibold flex items-center">
                  <Fuel className="mr-2 h-5 w-5 text-primary-700" />
                  {completedRoute.fuelUsed || '0 gal'}
                </p>
              </Card>
              
              <Card className="p-4 bg-primary-50">
                <h3 className="text-sm font-medium text-primary-500 mb-1">Deliveries</h3>
                <p className="text-2xl font-semibold">
                  {successfulDeliveries}/{totalDeliveries}
                </p>
              </Card>
            </div>
            
            <div className="mb-6">
              <div className="rounded-lg overflow-hidden border border-primary-200">
                <div className="h-60 w-full">
                  {/* A simplified version of the map showing the completed route */}
                  <DeliveryMap 
                    addresses={addresses.map(addr => ({
                      ...addr,
                      position: [0, 0], // Dummy positions, would be calculated in a real app
                    }))}
                  />
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-3">Delivery Details</h3>
              
              <div className="overflow-hidden border border-primary-200 rounded-lg">
                <table className="min-w-full divide-y divide-primary-200">
                  <thead className="bg-primary-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">Address</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">Status</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">Time</th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-primary-500 uppercase tracking-wider">Notes</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-primary-200">
                    {addresses.map((address) => (
                      <tr key={address.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-900">
                          {address.fullAddress}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            address.status === DeliveryStatus.DELIVERED
                              ? 'bg-success-100 text-success-800'
                              : address.status === DeliveryStatus.FAILED
                                ? 'bg-destructive-100 text-destructive-800'
                                : 'bg-primary-100 text-primary-800'
                          }`}>
                            {address.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-primary-500">
                          {address.deliveredAt 
                            ? format(new Date(address.deliveredAt), 'hh:mm a')
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-sm text-primary-500">
                          {address.specialInstructions || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            <div className="flex justify-end space-x-4">
              <Button variant="outline" onClick={handleExportCSV}>
                <FileDown className="mr-2 h-4 w-4" /> Export CSV
              </Button>
              <Button variant="outline" onClick={handleExportPDF}>
                <FilePdf className="mr-2 h-4 w-4" /> Export PDF
              </Button>
              <Button onClick={handleNewRoute}>
                <Plus className="mr-2 h-4 w-4" /> New Route
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
