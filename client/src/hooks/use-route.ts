import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { toast } from '@/hooks/use-toast';
import { InsertRoute, InsertRouteSettings, Route, RouteSettings } from '@shared/schema';
import { useState } from 'react';

export function useRouteSettings() {
  // Get route settings
  const routeSettingsQuery = useQuery({
    queryKey: ['/api/route-settings'],
  });

  // Update route settings
  const updateRouteSettingsMutation = useMutation({
    mutationFn: async (settings: Partial<RouteSettings>) => {
      const res = await apiRequest('PATCH', '/api/route-settings', settings);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Route optimization settings have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/route-settings'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update settings",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    routeSettings: routeSettingsQuery.data as RouteSettings,
    isLoadingRouteSettings: routeSettingsQuery.isLoading,
    updateRouteSettings: updateRouteSettingsMutation.mutate,
    isUpdatingRouteSettings: updateRouteSettingsMutation.isPending,
  };
}

export function useRoutes() {
  const [selectedRouteId, setSelectedRouteId] = useState<number | null>(null);

  // Get all routes
  const routesQuery = useQuery({
    queryKey: ['/api/routes'],
  });

  // Get a single route
  const routeQuery = useQuery({
    queryKey: ['/api/routes', selectedRouteId],
    enabled: selectedRouteId !== null,
  });

  // Create a new route
  const createRouteMutation = useMutation({
    mutationFn: async (routeData: InsertRoute) => {
      const res = await apiRequest('POST', '/api/routes', routeData);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Route created",
        description: "A new route has been created.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to create route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update a route
  const updateRouteMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Route> }) => {
      const res = await apiRequest('PATCH', `/api/routes/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Route updated",
        description: "The route has been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to update route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Optimize a route
  const optimizeRouteMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest('POST', '/api/routes/optimize', {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Route optimized",
        description: "Your delivery route has been optimized.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/addresses'] });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to optimize route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Complete a route
  const completeRouteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest('PATCH', `/api/routes/${id}/complete`, {});
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Route completed",
        description: "Your delivery route has been marked as completed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/routes'] });
    },
    onError: (error) => {
      toast({
        title: "Failed to complete route",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  return {
    routes: routesQuery.data as Route[] || [],
    isLoadingRoutes: routesQuery.isLoading,
    
    selectedRoute: routeQuery.data as Route | undefined,
    setSelectedRouteId,
    
    createRoute: createRouteMutation.mutate,
    isCreatingRoute: createRouteMutation.isPending,
    
    updateRoute: updateRouteMutation.mutate,
    isUpdatingRoute: updateRouteMutation.isPending,
    
    optimizeRoute: optimizeRouteMutation.mutate,
    isOptimizingRoute: optimizeRouteMutation.isPending,
    
    completeRoute: completeRouteMutation.mutate,
    isCompletingRoute: completeRouteMutation.isPending,
  };
}
