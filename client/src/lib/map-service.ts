import { AddressWithCoordinates, Coordinates, MapBounds, OptimizedRoute, RouteStep } from "./types";
import { DeliveryStatus, RouteSettings } from "@shared/schema";

// Nominatim (OpenStreetMap) geocoding API base URL
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// Geocoding function to get coordinates for an address using Nominatim API
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
    });
    
    const response = await fetch(`${NOMINATIM_BASE_URL}/search?${params.toString()}`, {
      headers: {
        // Nominatim requires a User-Agent header
        "User-Agent": "DeliveryNav/1.0"
      }
    });
    
    if (!response.ok) {
      throw new Error(`Geocoding failed: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data || data.length === 0) {
      return null;
    }
    
    // Nominatim returns lat/lon as strings
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    
    return { lat, lng };
  } catch (error) {
    console.error("Error geocoding address:", error);
    return null;
  }
}

// Function to calculate route between multiple points
// Since we're not using a paid routing API, we'll simulate the route calculation
export async function calculateRoute(
  addresses: AddressWithCoordinates[],
  settings: RouteSettings
): Promise<OptimizedRoute | null> {
  try {
    if (addresses.length < 2) {
      throw new Error("At least two addresses are required for route calculation");
    }
    
    // Simulate route calculation
    // For a free alternative, we're simulating the results rather than using a real API
    
    // Create route coordinates by connecting the points directly (as the crow flies)
    const routeCoordinates: [number, number][] = addresses.map(a => [a.position[1], a.position[0]]);
    
    // Calculate total distance (approximation using Haversine formula)
    let totalDistance = 0;
    for (let i = 0; i < addresses.length - 1; i++) {
      totalDistance += calculateHaversineDistance(
        addresses[i].position[0], addresses[i].position[1],
        addresses[i + 1].position[0], addresses[i + 1].position[1]
      );
    }
    
    // Convert to miles
    const distanceInMiles = totalDistance;
    
    // Simulate duration (assuming average speed of 30 mph)
    const durationInSeconds = (distanceInMiles / 30) * 3600;
    
    // Calculate estimated fuel consumption (assuming 25 mpg)
    const fuelConsumption = (distanceInMiles / 25).toFixed(1);
    
    // Generate simple instruction steps between each point
    const steps: RouteStep[] = [];
    for (let i = 0; i < addresses.length - 1; i++) {
      const fromAddress = addresses[i];
      const toAddress = addresses[i + 1];
      const distance = calculateHaversineDistance(
        fromAddress.position[0], fromAddress.position[1],
        toAddress.position[0], toAddress.position[1]
      );
      
      // Estimate time based on distance
      const duration = (distance / 30) * 60; // minutes, assuming 30 mph
      
      steps.push({
        instruction: `Drive from ${fromAddress.fullAddress} to ${toAddress.fullAddress}`,
        distance: `${distance.toFixed(1)} mi`,
        duration: `${Math.round(duration)} min`,
      });
    }
    
    // Order waypoints based on settings (simple implementation)
    // In a real app, you'd use a proper TSP algorithm
    const optimizedWaypoints = [...addresses];
    
    return {
      waypoints: optimizedWaypoints,
      totalDistance: `${distanceInMiles.toFixed(1)} mi`,
      totalDuration: formatDuration(durationInSeconds),
      totalFuel: `${fuelConsumption} gal`,
      steps,
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}

// Haversine formula to calculate distance between two points on Earth
function calculateHaversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.8; // Earth's radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format duration from seconds to hours and minutes
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  
  return `${minutes}m`;
}

// Calculate bounds for a set of coordinates
export function calculateBounds(coordinates: Coordinates[]): MapBounds {
  if (coordinates.length === 0) {
    // Default to SF Bay Area if no coordinates
    return {
      north: 37.8,
      south: 37.7,
      east: -122.3,
      west: -122.5,
    };
  }
  
  const bounds = coordinates.reduce(
    (acc, coord) => {
      return {
        north: Math.max(acc.north, coord.lat),
        south: Math.min(acc.south, coord.lat),
        east: Math.max(acc.east, coord.lng),
        west: Math.min(acc.west, coord.lng),
      };
    },
    {
      north: -90,
      south: 90,
      east: -180,
      west: 180,
    }
  );
  
  // Add padding
  const latPadding = (bounds.north - bounds.south) * 0.1;
  const lngPadding = (bounds.east - bounds.west) * 0.1;
  
  return {
    north: bounds.north + latPadding,
    south: bounds.south - latPadding,
    east: bounds.east + lngPadding,
    west: bounds.west - lngPadding,
  };
}
