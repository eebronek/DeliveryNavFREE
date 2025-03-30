import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddressWithCoordinates, Coordinates, MapBounds, RouteStep } from '@/lib/types';
import { calculateBounds } from '@/lib/map-service';
import { Address } from '@shared/schema';
import { Loader, Navigation2 } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface DeliveryMapProps {
  addresses: AddressWithCoordinates[];
  currentRoute?: {
    coordinates: [number, number][];
    currentLocation?: Coordinates;
    steps?: RouteStep[];
  };
  isLoading?: boolean;
  activeAddressId?: number;
  showActiveStepDirections?: boolean;
  activeStepIndex?: number;
  title?: string;
  fullScreen?: boolean;
  showRouteOverview?: boolean; // New prop to toggle between detailed navigation view and full route overview
}

export function DeliveryMap({ 
  addresses, 
  currentRoute, 
  isLoading = false, 
  activeAddressId,
  showActiveStepDirections = false,
  activeStepIndex = 0,
  title = "Route Preview",
  fullScreen = false,
  showRouteOverview = false
}: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const currentLocationMarkerRef = useRef<L.Marker | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const roadOutlineRef = useRef<L.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Create map instance - starting with Europe/Poland area instead of San Francisco
    map.current = L.map(mapContainer.current).setView([50.0646, 19.9450], 8);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);
    
    // Add scale control
    L.control.scale().addTo(map.current);
    
    // Add locate control to find user's current position
    const addLocateControl = (map: L.Map) => {
      // Create a custom button element
      const controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('a', '', controlDiv);
      
      button.href = '#';
      button.title = 'Find my location';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '30px';
      button.style.height = '30px';
      
      // Set button content
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <circle cx="12" cy="12" r="10"></circle>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
      `;
      
      // Add click event
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              map.setView([position.coords.latitude, position.coords.longitude], 16);
            },
            (error) => {
              console.error("Error getting current location:", error);
            }
          );
        }
      });
      
      return controlDiv;
    };
    
    // Add the custom control to the map
    const locateControl = new L.Control({position: 'topleft'});
    locateControl.onAdd = addLocateControl;
    locateControl.addTo(map.current);
    
    // Add zoom in and center control
    const addZoomCenterControl = (map: L.Map) => {
      // Create a custom button element
      const controlDiv = L.DomUtil.create('div', 'leaflet-bar leaflet-control');
      const button = L.DomUtil.create('a', '', controlDiv);
      
      button.href = '#';
      button.title = 'Zoom in closer to see turns';
      button.style.display = 'flex';
      button.style.alignItems = 'center';
      button.style.justifyContent = 'center';
      button.style.width = '30px';
      button.style.height = '30px';
      button.style.backgroundColor = '#3b82f6'; // Blue background
      button.style.color = 'white'; // White icon
      button.style.fontWeight = 'bold';
      
      // Set button content
      button.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" width="16" height="16">
          <circle cx="11" cy="11" r="8"></circle>
          <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
          <line x1="11" y1="8" x2="11" y2="14"></line>
          <line x1="8" y1="11" x2="14" y2="11"></line>
        </svg>
      `;
      
      // Add click event
      L.DomEvent.on(button, 'click', (e) => {
        L.DomEvent.preventDefault(e);
        
        // Check if we should focus on the active address
        if (activeAddressId && addresses.length > 0) {
          // Find the active address
          const activeAddress = addresses.find(a => a.id === activeAddressId);
          
          if (activeAddress) {
            // Zoom in much closer to the active address
            map.setView([activeAddress.position[0], activeAddress.position[1]], 18);
            console.log(`Zoomed in to active address: ${activeAddress.fullAddress}`);
            return;
          }
        }
        
        // Otherwise recalculate bounds and center the map
        if (addresses.length > 0) {
          const coords = addresses.map(a => ({ lat: a.position[0], lng: a.position[1] }));
          const bounds = calculateBounds(coords, currentRoute?.currentLocation);
          
          map.fitBounds([
            [bounds.south, bounds.west],
            [bounds.north, bounds.east]
          ], { 
            padding: [40, 40],
            maxZoom: 18 // Increased max zoom level for better turn visibility
          });
        } else if (currentRoute?.currentLocation) {
          // If no addresses but we have a current location, center on that
          map.setView(
            [currentRoute.currentLocation.lat, currentRoute.currentLocation.lng], 
            18 // Increased zoom level
          );
        }
      });
      
      return controlDiv;
    };
    
    // Add the zoom center control to the map
    const zoomCenterControl = new L.Control({position: 'bottomright'});
    zoomCenterControl.onAdd = addZoomCenterControl;
    zoomCenterControl.addTo(map.current);
    
    setMapLoaded(true);
    
    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, [addresses, currentRoute]);
  
  // Update markers and route when addresses or active address changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear previous current location marker
    if (currentLocationMarkerRef.current) {
      currentLocationMarkerRef.current.remove();
      currentLocationMarkerRef.current = null;
    }
    
    // Clear previous routes
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    
    // Clear road outline
    if (roadOutlineRef.current) {
      roadOutlineRef.current.remove();
      roadOutlineRef.current = null;
    }
    
    if (addresses.length === 0 && !currentRoute?.currentLocation) return;
    
    // Create custom marker icon
    const createMarkerIcon = (index: number, isActive: boolean) => {
      return L.divIcon({
        className: 'custom-marker',
        html: `<div style="
          width: 25px;
          height: 25px;
          border-radius: 50%;
          background-color: ${isActive ? '#ef4444' : '#0f172a'};
          border: 2px solid white;
          color: white;
          text-align: center;
          line-height: 22px;
          font-weight: bold;
          font-size: 12px;
        ">${index + 1}</div>`,
        iconSize: [25, 25],
        iconAnchor: [12, 12]
      });
    };
    
    // Create current location marker icon
    const createCurrentLocationIcon = () => {
      return L.divIcon({
        className: 'current-location-marker',
        html: `<div style="
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: #3b82f6;
          border: 2px solid white;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.4), 0 0 10px rgba(59, 130, 246, 0.4);
        "></div>`,
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      });
    };
    
    // Add current location marker if available
    if (currentRoute?.currentLocation) {
      const { lat, lng } = currentRoute.currentLocation;
      currentLocationMarkerRef.current = L.marker([lat, lng], {
        icon: createCurrentLocationIcon(),
        zIndexOffset: 1000
      }).addTo(map.current);
      
      currentLocationMarkerRef.current.bindPopup("Your current location");
    }
    
    // Add markers for each address
    console.log(`Adding markers for ${addresses.length} addresses`);
    addresses.forEach((address, index) => {
      console.log(`Adding marker for address #${index + 1}:`, address.fullAddress, 'at position:', address.position);
      
      const isActive = address.id === activeAddressId;
      try {
        const marker = L.marker([address.position[0], address.position[1]], {
          icon: createMarkerIcon(index, isActive)
        }).addTo(map.current!);
        
        // Add popup with address info
        marker.bindPopup(
          `<strong>${address.fullAddress}</strong>` +
          (address.specialInstructions ? `<br>${address.specialInstructions}` : '') +
          (address.exactDeliveryTime ? `<br>Delivery time: ${address.exactDeliveryTime}` : '')
        );
        
        markersRef.current.push(marker);
        console.log(`Successfully added marker for ${address.fullAddress}`);
      } catch (error) {
        console.error(`Error adding marker for address ${address.fullAddress}:`, error);
      }
    });
    
    // Calculate and set bounds considering current location
    const coords = addresses.map(a => ({ lat: a.position[0], lng: a.position[1] }));
    const bounds = calculateBounds(coords, currentRoute?.currentLocation);
    
    // If in route overview mode, zoom out to show all stops and route
    // Otherwise, focus on current/active address with less padding
    map.current.fitBounds([
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    ], { 
      padding: showRouteOverview ? [60, 60] : [40, 40],
      maxZoom: showRouteOverview ? 14 : 17 // Lower maxZoom for overview means more zoomed out
    });
    
    // Draw route path if available
    if (currentRoute && currentRoute.coordinates && currentRoute.coordinates.length > 0) {
      // For Leaflet, we need [lat, lng] points
      const routePoints: [number, number][] = [];
      
      for (const coord of currentRoute.coordinates) {
        // Ensure we have both latitude and longitude
        if (coord.length >= 2) {
          // Map coordinates are in [lng, lat] format, convert to [lat, lng]
          routePoints.push([coord[1], coord[0]]);
        }
      }
      
      // Draw the route as a polyline
      if (routePoints.length > 0) {
        // Add an offset polyline for a road-like appearance
        roadOutlineRef.current = L.polyline(routePoints, {
          color: '#334155', // Slate-700 for road outline
          weight: 8,
          opacity: 0.6,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map.current);
        
        // Main route polyline
        routeLayerRef.current = L.polyline(routePoints, {
          color: '#3b82f6', // Blue color for the route
          weight: 5,
          opacity: 0.8,
          lineCap: 'round',
          lineJoin: 'round'
        }).addTo(map.current);
        
        // Highlight active segment if turn-by-turn is active
        if (showActiveStepDirections && currentRoute.steps && activeStepIndex < currentRoute.steps.length) {
          // This is a simplified version - in a real app we would highlight the specific segment
          // Here we're just making the line more prominent
          routeLayerRef.current.setStyle({
            color: '#2563eb', // Darker blue
            weight: 6,
            opacity: 1
          });
          
          // Add pulsing animation for active route using a dot at the current position
          // This helps to show the active navigation point
          if (currentRoute.currentLocation) {
            const pulsingIcon = L.divIcon({
              className: 'pulsing-icon',
              html: `<div style="
                width: 15px;
                height: 15px;
                background-color: #2563eb;
                border-radius: 50%;
                border: 2px solid white;
                box-shadow: 0 0 10px #2563eb;
                animation: pulse 1.5s infinite;
              "></div>
              <style>
                @keyframes pulse {
                  0% { transform: scale(0.8); opacity: 1; }
                  70% { transform: scale(1.5); opacity: 0.7; }
                  100% { transform: scale(0.8); opacity: 1; }
                }
              </style>`,
              iconSize: [15, 15],
              iconAnchor: [7.5, 7.5]
            });
            
            // Add a pulsing dot at the start of the route 
            // (for now just using the current location; in a real app would use GPS position)
            L.marker([currentRoute.currentLocation.lat, currentRoute.currentLocation.lng], {
              icon: pulsingIcon,
              zIndexOffset: 1001
            }).addTo(map.current);
          }
        }
      }
    }
  }, [addresses, mapLoaded, currentRoute, activeAddressId, showActiveStepDirections, activeStepIndex, showRouteOverview]);
  
  // Additional effect to handle map size changes when fullScreen or overview mode changes
  useEffect(() => {
    if (map.current && mapLoaded) {
      // Force a resize event after a slight delay to ensure the container has been resized
      setTimeout(() => {
        if (map.current) {
          map.current.invalidateSize();
          
          // If we have coords, recalculate the bounds when toggling overview mode
          if (addresses.length > 0) {
            const coords = addresses.map(a => ({ lat: a.position[0], lng: a.position[1] }));
            const bounds = calculateBounds(coords, currentRoute?.currentLocation);
            
            map.current.fitBounds([
              [bounds.south, bounds.west],
              [bounds.north, bounds.east]
            ], { 
              padding: showRouteOverview ? [60, 60] : [40, 40],
              maxZoom: showRouteOverview ? 14 : 17 // Lower maxZoom for overview means more zoomed out
            });
          }
        }
      }, 100);
    }
  }, [fullScreen, mapLoaded, showRouteOverview, addresses, currentRoute]);

  return (
    <Card className={fullScreen ? "h-full" : ""}>
      <CardHeader className="p-4 border-b border-primary-200">
        <h2 className="text-lg font-semibold">{title}</h2>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className={`relative ${fullScreen ? "h-[calc(100vh-12rem)]" : ""}`}>
          <div 
            ref={mapContainer} 
            className={fullScreen ? "h-full w-full" : "h-96 w-full"}
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <Loader className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            )}
          </div>
          
          {/* Current direction indicator */}
          {showActiveStepDirections && currentRoute?.steps && currentRoute.steps.length > 0 && activeStepIndex < currentRoute.steps.length && (
            <div className="absolute bottom-4 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-3 shadow-lg border border-primary-100">
              <div className="flex items-center">
                <div className="bg-primary-100 p-2 rounded-full mr-3">
                  <Navigation2 className="h-6 w-6 text-primary-700" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{currentRoute.steps[activeStepIndex].instruction}</p>
                  <div className="flex text-sm text-primary-600 mt-1">
                    <span className="mr-3">{currentRoute.steps[activeStepIndex].distance}</span>
                    <span>{currentRoute.steps[activeStepIndex].duration}</span>
                    {currentRoute.steps[activeStepIndex].streetName && (
                      <span className="ml-auto italic">{currentRoute.steps[activeStepIndex].streetName}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Route overview indicator */}
          {showRouteOverview && !showActiveStepDirections && (
            <div className="absolute top-16 left-4 right-4 bg-white bg-opacity-90 rounded-lg p-2 shadow-lg border border-primary-100 max-w-xs mx-auto">
              <div className="flex items-center justify-center text-center">
                <div className="flex-1">
                  <p className="font-medium text-primary-700">Route Overview</p>
                  <p className="text-xs text-primary-600">
                    Showing all {addresses.length} stops
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
