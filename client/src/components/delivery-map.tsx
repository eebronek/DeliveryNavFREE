import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { AddressWithCoordinates, MapBounds } from '@/lib/types';
import { calculateBounds } from '@/lib/map-service';
import { Address } from '@shared/schema';
import { Loader } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

interface DeliveryMapProps {
  addresses: AddressWithCoordinates[];
  currentRoute?: {
    coordinates: [number, number][];
  };
  isLoading?: boolean;
  activeAddressId?: number;
}

export function DeliveryMap({ addresses, currentRoute, isLoading = false, activeAddressId }: DeliveryMapProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  // Initialize map on component mount
  useEffect(() => {
    if (!mapContainer.current || map.current) return;
    
    // Create map instance
    map.current = L.map(mapContainer.current).setView([37.7749, -122.4194], 11);
    
    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map.current);
    
    // Add scale control
    L.control.scale().addTo(map.current);
    
    setMapLoaded(true);
    
    // Cleanup function
    return () => {
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);
  
  // Update markers and route when addresses or active address changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    
    // Clear previous markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];
    
    // Clear previous route
    if (routeLayerRef.current) {
      routeLayerRef.current.remove();
      routeLayerRef.current = null;
    }
    
    if (addresses.length === 0) return;
    
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
    
    // Add markers for each address
    addresses.forEach((address, index) => {
      const isActive = address.id === activeAddressId;
      const marker = L.marker([address.position[0], address.position[1]], {
        icon: createMarkerIcon(index, isActive)
      }).addTo(map.current!);
      
      // Add popup with address info
      marker.bindPopup(
        `<strong>${address.fullAddress}</strong>` +
        (address.specialInstructions ? `<br>${address.specialInstructions}` : '')
      );
      
      markersRef.current.push(marker);
    });
    
    // Calculate and set bounds
    const coords = addresses.map(a => ({ lat: a.position[0], lng: a.position[1] }));
    const bounds = calculateBounds(coords);
    map.current.fitBounds([
      [bounds.south, bounds.west],
      [bounds.north, bounds.east]
    ], { padding: [40, 40] });
    
    // Draw route path if available
    if (currentRoute && currentRoute.coordinates.length > 0) {
      // Convert from [lng, lat] to [lat, lng] format for Leaflet
      const routePoints = currentRoute.coordinates.map(coord => [coord[1], coord[0]] as [number, number]);
      routeLayerRef.current = L.polyline(routePoints, {
        color: '#0f172a',
        weight: 4,
        opacity: 0.75
      }).addTo(map.current);
    }
  }, [addresses, mapLoaded, currentRoute, activeAddressId]);
  
  return (
    <Card>
      <CardHeader className="p-4 border-b border-primary-200">
        <h2 className="text-lg font-semibold">Route Preview</h2>
      </CardHeader>
      
      <CardContent className="p-0">
        <div className="relative">
          <div 
            ref={mapContainer} 
            className="h-96 w-full"
          >
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 z-10">
                <Loader className="h-8 w-8 animate-spin text-primary-500" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
