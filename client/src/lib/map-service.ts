import { AddressWithCoordinates, Coordinates, MapBounds, OptimizedRoute, RouteStep, TurnByTurnDirection } from "./types";
import { DeliveryStatus, RouteSettings } from "@shared/schema";

// Nominatim (OpenStreetMap) geocoding API base URL
const NOMINATIM_BASE_URL = "https://nominatim.openstreetmap.org";

// OSRM API base URL (free routing service)
const OSRM_BASE_URL = "https://router.project-osrm.org";

// OpenRouteService API base URL (not used, keeping for reference)
const OPENROUTE_BASE_URL = "https://api.openrouteservice.org";

// Cache for geocoded addresses to minimize API calls
const geocodeCache = new Map<string, Coordinates>();

// Geocoding function to get coordinates for an address using Nominatim API
export async function geocodeAddress(address: string): Promise<Coordinates | null> {
  try {
    console.log(`Attempting to geocode address: ${address}`);
    
    // Check cache first
    if (geocodeCache.has(address)) {
      console.log(`Using cached coordinates for: ${address}`);
      return geocodeCache.get(address)!;
    }
    
    const params = new URLSearchParams({
      q: address,
      format: "json",
      limit: "1",
    });
    
    console.log(`Making geocoding request for: ${address}`);
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
    console.log(`Geocoding response for "${address}":`, data);
    
    if (!data || data.length === 0) {
      console.warn(`No geocoding results found for: ${address}`);
      return null;
    }
    
    // Nominatim returns lat/lon as strings
    const lat = parseFloat(data[0].lat);
    const lng = parseFloat(data[0].lon);
    
    const coordinates = { lat, lng };
    console.log(`Successfully geocoded ${address} to:`, coordinates);
    
    // Cache the result
    geocodeCache.set(address, coordinates);
    
    return coordinates;
  } catch (error) {
    console.error(`Error geocoding address: ${address}`, error);
    return null;
  }
}

// Function to get the user's current location
export function getCurrentLocation(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by your browser"));
      return;
    }
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
      },
      (error) => {
        reject(new Error(`Error getting current location: ${error.message}`));
      },
      { 
        enableHighAccuracy: true, 
        timeout: 10000, 
        maximumAge: 0 
      }
    );
  });
}

// Function to calculate route between multiple points using either OpenRouteService or simulated routing
export async function calculateRoute(
  addresses: AddressWithCoordinates[],
  settings: RouteSettings,
  startFromCurrentLocation: boolean = false
): Promise<OptimizedRoute | null> {
  try {
    if (addresses.length < 1) {
      throw new Error("At least one address is required for route calculation");
    }
    
    // Order waypoints based on time constraints and settings
    // First, separate addresses with exact delivery times from those without
    const addressesWithDeliveryTime = addresses.filter(addr => addr.exactDeliveryTime);
    const addressesWithoutDeliveryTime = addresses.filter(addr => !addr.exactDeliveryTime);
    
    // Sort addresses with delivery times by their delivery time
    const sortedDeliveryTimeAddresses = [...addressesWithDeliveryTime].sort((a, b) => {
      if (!a.exactDeliveryTime || !b.exactDeliveryTime) return 0;
      return a.exactDeliveryTime.localeCompare(b.exactDeliveryTime);
    });
    
    // Get current location if needed
    let currentLocation: Coordinates | null = null;
    if (startFromCurrentLocation) {
      try {
        currentLocation = await getCurrentLocation();
      } catch (error) {
        console.error("Failed to get current location:", error);
        // Fall back to first address if we can't get current location
        if (addresses.length > 0) {
          currentLocation = {
            lat: addresses[0].position[0],
            lng: addresses[0].position[1]
          };
        }
      }
    }
    
    // Initialize the optimized waypoints with the sorted time-specific addresses
    let optimizedWaypoints: AddressWithCoordinates[] = [...sortedDeliveryTimeAddresses];
    
    // If there are no time-specific addresses, use a simple approach
    if (sortedDeliveryTimeAddresses.length === 0) {
      // If we have current location and it's different from the first address,
      // we need to handle the routing specially
      if (startFromCurrentLocation && currentLocation) {
        // Find the closest address to current location to start with
        let closestAddrIndex = 0;
        let shortestDistance = Number.MAX_VALUE;
        
        for (let i = 0; i < addresses.length; i++) {
          const addr = addresses[i];
          const distance = calculateHaversineDistance(
            currentLocation.lat, currentLocation.lng,
            addr.position[0], addr.position[1]
          );
          
          if (distance < shortestDistance) {
            shortestDistance = distance;
            closestAddrIndex = i;
          }
        }
        
        // Reorder addresses to start with the closest one
        const reorderedAddresses = [
          addresses[closestAddrIndex],
          ...addresses.slice(0, closestAddrIndex),
          ...addresses.slice(closestAddrIndex + 1)
        ];
        
        optimizedWaypoints = reorderedAddresses;
      } else {
        optimizedWaypoints = [...addresses];
      }
    } else {
      // Add addresses without specific times in between time-specific ones
      // based on their proximity to minimize detours
      for (const addr of addressesWithoutDeliveryTime) {
        if (optimizedWaypoints.length === 0) {
          optimizedWaypoints.push(addr);
          continue;
        }
        
        let bestPosition = 0;
        let shortestDetour = Number.MAX_VALUE;
        
        // Find the best position to insert this address
        for (let i = 0; i <= optimizedWaypoints.length; i++) {
          const prevAddr = i === 0 ? optimizedWaypoints[optimizedWaypoints.length - 1] : optimizedWaypoints[i - 1];
          const nextAddr = i === optimizedWaypoints.length ? optimizedWaypoints[0] : optimizedWaypoints[i];
          
          // Calculate detour distance
          const directDistance = calculateHaversineDistance(
            prevAddr.position[0], prevAddr.position[1],
            nextAddr.position[0], nextAddr.position[1]
          );
          
          const detourDistance = calculateHaversineDistance(
            prevAddr.position[0], prevAddr.position[1],
            addr.position[0], addr.position[1]
          ) + calculateHaversineDistance(
            addr.position[0], addr.position[1],
            nextAddr.position[0], nextAddr.position[1]
          );
          
          const detour = detourDistance - directDistance;
          
          if (detour < shortestDetour) {
            shortestDetour = detour;
            bestPosition = i;
          }
        }
        
        // Insert at the best position
        optimizedWaypoints.splice(bestPosition, 0, addr);
      }
    }
    
    // Try to get real routing from OSRM (free OpenStreetMap routing service)
    let realRouteCoordinates: [number, number][] = [];
    let realRouteSteps: RouteStep[] = [];
    let realRouteTotalDistance = 0;
    let realRouteTotalDuration = 0;
    
    try {
      // Prepare waypoints for OSRM (they use [longitude, latitude] format)
      const waypoints = optimizedWaypoints.map(addr => [addr.position[1], addr.position[0]]);
      
      // Add current location as the first waypoint if available
      if (startFromCurrentLocation && currentLocation) {
        waypoints.unshift([currentLocation.lng, currentLocation.lat]);
      }
      
      if (waypoints.length >= 2) {
        // For each segment, get directions from OSRM
        realRouteSteps = [];
        let cumulativeDistance = 0;
        let totalCoordinates: [number, number][] = [];
        
        for (let i = 0; i < waypoints.length - 1; i++) {
          const start = waypoints[i];
          const end = waypoints[i + 1];
          
          // Construct OSRM API URL for route between two points
          // Format: /route/v1/{profile}/{coordinates}
          // profile is "driving" for car routes
          // coordinates are in longitude,latitude format separated by ;
          const url = `${OSRM_BASE_URL}/route/v1/driving/${start[0]},${start[1]};${end[0]},${end[1]}?overview=full&steps=true&geometries=geojson`;
          
          console.log(`Requesting turn-by-turn directions for segment ${i+1}/${waypoints.length-1}:`, url);
          
          try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`OSRM API returned ${response.status}`);
            
            const data = await response.json();
            console.log(`OSRM response for segment ${i+1}:`, data.code === 'Ok' ? 'SUCCESS' : 'FAILED', data);
            
            if (data && data.routes && data.routes.length > 0) {
              const route = data.routes[0];
              const distanceInMiles = route.distance / 1609.34; // Convert meters to miles
              const durationInSeconds = route.duration;
              
              // Add distance and duration to totals
              cumulativeDistance += distanceInMiles;
              realRouteTotalDuration += durationInSeconds;
              
              // Get route geometry (array of coordinates)
              if (route.geometry && route.geometry.coordinates) {
                // OSRM returns coordinates as [longitude, latitude]
                const segmentCoordinates = route.geometry.coordinates.map((coord: number[]) => {
                  return [coord[0], coord[1]] as [number, number];
                });
                
                totalCoordinates = [...totalCoordinates, ...segmentCoordinates];
              }
              
              // Process steps if available
              if (route.legs && route.legs.length > 0 && route.legs[0].steps) {
                const steps = route.legs[0].steps;
                
                // Create a step for each maneuver
                steps.forEach((step: any, stepIndex: number) => {
                  const isLastStep = stepIndex === steps.length - 1;
                  const isLastSegment = i === waypoints.length - 2;
                  
                  // Convert distance to miles and duration to minutes
                  const stepDistanceMiles = step.distance / 1609.34;
                  const stepDurationMinutes = step.duration / 60;
                  
                  // Get instruction based on maneuver type or use OSRM's instruction
                  let instruction = step.maneuver?.instruction || 'Continue on route';
                  let turnType = step.maneuver?.type || 'straight';
                  
                  // For the final step of the final segment, make it clear this is the destination
                  if (isLastStep && isLastSegment) {
                    const destinationAddr = i+1 < optimizedWaypoints.length ? optimizedWaypoints[i+1] : null;
                    if (destinationAddr) {
                      instruction = `Arrive at ${destinationAddr.fullAddress}`;
                      turnType = 'arrive';
                      
                      // Add special note for time-specific deliveries to arrive 3 minutes early
                      if (destinationAddr.exactDeliveryTime) {
                        instruction += ` (Arrive by ${destinationAddr.exactDeliveryTime}, aim to be 3 minutes early)`;
                      }
                    } else {
                      instruction = 'Arrive at destination';
                    }
                  }
                  
                  // Extract street name if available
                  const streetName = step.name || '';
                  
                  realRouteSteps.push({
                    instruction,
                    distance: `${stepDistanceMiles.toFixed(1)} mi`,
                    duration: `${Math.round(stepDurationMinutes)} min`,
                    turnType,
                    streetName,
                    isDestination: isLastStep && isLastSegment
                  });
                });
              }
            }
          } catch (routeError) {
            console.error("Error fetching segment route:", routeError);
            // Generate fallback directions for this segment
            const fromAddr = i < optimizedWaypoints.length ? optimizedWaypoints[i] : null;
            const toAddr = i+1 < optimizedWaypoints.length ? optimizedWaypoints[i+1] : null;
            
            if (fromAddr && toAddr) {
              // Calculate direct distance and bearing between points
              const distance = calculateHaversineDistance(
                fromAddr.position[0], fromAddr.position[1],
                toAddr.position[0], toAddr.position[1]
              );
              
              const bearing = calculateBearing(
                fromAddr.position[0], fromAddr.position[1],
                toAddr.position[0], toAddr.position[1]
              );
              
              cumulativeDistance += distance;
              
              // Generate simple directions
              realRouteSteps.push({
                instruction: `Head to ${toAddr.fullAddress}`,
                distance: `${distance.toFixed(1)} mi`,
                duration: `${Math.round((distance / 30) * 60)} min`, // minutes at 30mph
                isDestination: i === waypoints.length - 2
              });
              
              // Add direct line coordinates
              totalCoordinates.push([fromAddr.position[1], fromAddr.position[0]]);
              totalCoordinates.push([toAddr.position[1], toAddr.position[0]]);
            }
          }
        }
        
        // Use the accumulated route coordinates
        if (totalCoordinates.length > 0) {
          realRouteCoordinates = totalCoordinates;
        }
        
        realRouteTotalDistance = cumulativeDistance;
      } else {
        // If we only have one waypoint, create a simple arrival step
        const destination = optimizedWaypoints[0];
        realRouteSteps = [{
          instruction: `Arrive at ${destination.fullAddress}`,
          distance: '0.0 mi',
          duration: '0 min',
          isDestination: true
        }];
      }
    } catch (error) {
      console.error("Error getting detailed routing:", error);
      // Fall back to direct lines if API fails
    }
    
    // Use real routing data if available, otherwise fall back to direct lines
    const useRealRouting = realRouteCoordinates.length > 0;
    
    // If real routing failed, fall back to direct lines
    if (!useRealRouting) {
      const routeCoordinates: [number, number][] = optimizedWaypoints.map(a => [a.position[1], a.position[0]]);
      
      // If we have current location, add it as the first point
      if (startFromCurrentLocation && currentLocation) {
        routeCoordinates.unshift([currentLocation.lng, currentLocation.lat]);
      }
      
      realRouteCoordinates = routeCoordinates;
      
      // Calculate total distance manually
      let totalDistance = 0;
      for (let i = 0; i < optimizedWaypoints.length - 1; i++) {
        totalDistance += calculateHaversineDistance(
          optimizedWaypoints[i].position[0], optimizedWaypoints[i].position[1],
          optimizedWaypoints[i + 1].position[0], optimizedWaypoints[i + 1].position[1]
        );
      }
      
      realRouteTotalDistance = totalDistance;
      realRouteTotalDuration = (totalDistance / 30) * 3600; // seconds at 30mph
      
      // Generate basic instruction steps
      realRouteSteps = [];
      for (let i = 0; i < optimizedWaypoints.length - 1; i++) {
        const fromAddress = optimizedWaypoints[i];
        const toAddress = optimizedWaypoints[i + 1];
        const distance = calculateHaversineDistance(
          fromAddress.position[0], fromAddress.position[1],
          toAddress.position[0], toAddress.position[1]
        );
        
        // Estimate time based on distance
        const duration = (distance / 30) * 60; // minutes, assuming 30 mph
        
        let instruction = `Drive to ${toAddress.fullAddress}`;
        
        // Add special instruction for time-specific deliveries to arrive 3 minutes early
        if (toAddress.exactDeliveryTime) {
          instruction += ` (Arrive by ${toAddress.exactDeliveryTime}, aim to be 3 minutes early)`;
        }
        
        realRouteSteps.push({
          instruction,
          distance: `${distance.toFixed(1)} mi`,
          duration: `${Math.round(duration)} min`,
          isDestination: i === optimizedWaypoints.length - 2
        });
      }
    }
    
    // Calculate estimated fuel consumption (assuming 25 mpg)
    const fuelConsumption = (realRouteTotalDistance / 25).toFixed(1);
    
    return {
      waypoints: optimizedWaypoints,
      totalDistance: `${realRouteTotalDistance.toFixed(1)} mi`,
      totalDuration: formatDuration(realRouteTotalDuration),
      totalFuel: `${fuelConsumption} gal`,
      steps: realRouteSteps,
      coordinates: realRouteCoordinates,
      currentLocation: currentLocation || undefined
    };
  } catch (error) {
    console.error("Error calculating route:", error);
    return null;
  }
}

// Function to generate realistic turn-by-turn directions
function generateTurnByTurnDirections(
  fromAddress: string,
  toAddress: string,
  distance: number,
  bearing: number
): TurnByTurnDirection[] {
  // This is a simulation - in a real app, this would come from a routing API
  
  // Extract street names from addresses (this is a simple simulation)
  const fromStreet = extractStreetName(fromAddress);
  const toStreet = extractStreetName(toAddress);
  
  // Generate a realistic number of turns based on distance
  // For short distances, maybe just 1-2 turns, for longer distances, more turns
  const numSegments = Math.max(1, Math.min(5, Math.floor(distance / 0.5)));
  
  // Generate some fake street names for the turns
  const streetNames = [
    fromStreet, 
    "Main St", 
    "Oak Ave", 
    "Washington Blvd", 
    "Park Rd",
    toStreet
  ];
  
  // Make sure we have enough street names
  while (streetNames.length < numSegments + 1) {
    streetNames.push(`Street ${streetNames.length}`);
  }
  
  // Distribute the total distance across segments
  let remainingDistance = distance;
  const directions: TurnByTurnDirection[] = [];
  
  for (let i = 0; i < numSegments; i++) {
    const isFirst = i === 0;
    const isLast = i === numSegments - 1;
    
    // Allocate a portion of the remaining distance to this segment
    // Last segment gets all remaining distance
    const segmentDistance = isLast 
      ? remainingDistance 
      : remainingDistance / (numSegments - i) * (0.7 + Math.random() * 0.6);
    
    remainingDistance -= segmentDistance;
    
    // Determine turn type
    let turnType = "straight";
    let instruction = "";
    
    if (isFirst) {
      // First direction is always "Head" or "Continue"
      turnType = "depart";
      instruction = `Head ${getBearingDirection(bearing)} on ${streetNames[i+1]}`;
    } else if (isLast) {
      // Last turn arrives at destination
      turnType = "arrive";
      instruction = `Arrive at destination: ${toAddress}`;
    } else {
      // For middle segments, generate realistic turns
      const turns = ["slight left", "left", "sharp left", "straight", "slight right", "right", "sharp right"];
      turnType = turns[Math.floor(Math.random() * turns.length)];
      
      switch (turnType) {
        case "slight left":
          instruction = `Make a slight left turn onto ${streetNames[i+1]}`;
          break;
        case "left":
          instruction = `Turn left onto ${streetNames[i+1]}`;
          break;
        case "sharp left":
          instruction = `Make a sharp left turn onto ${streetNames[i+1]}`;
          break;
        case "straight":
          instruction = `Continue straight onto ${streetNames[i+1]}`;
          break;
        case "slight right":
          instruction = `Make a slight right turn onto ${streetNames[i+1]}`;
          break;
        case "right":
          instruction = `Turn right onto ${streetNames[i+1]}`;
          break;
        case "sharp right":
          instruction = `Make a sharp right turn onto ${streetNames[i+1]}`;
          break;
      }
    }
    
    directions.push({
      instruction,
      distance: segmentDistance,
      turnType,
      streetName: streetNames[i+1]
    });
  }
  
  return directions;
}

// Helper function to extract a street name from an address
function extractStreetName(address: string): string {
  // Very simplistic - in a real app, would use address parsing libraries
  const parts = address.split(',');
  if (parts.length > 0) {
    // Take the first part and remove any numbers
    return parts[0].replace(/^\d+\s*/, '').trim();
  }
  return "Unknown Street";
}

// Function to get direction based on bearing
function getBearingDirection(bearing: number): string {
  const directions = ["north", "northeast", "east", "southeast", "south", "southwest", "west", "northwest"];
  return directions[Math.floor(((bearing + 22.5) % 360) / 45)];
}

// Calculate bearing between two points
function calculateBearing(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const toRadians = (deg: number) => deg * Math.PI / 180;
  
  const φ1 = toRadians(lat1);
  const φ2 = toRadians(lat2);
  const λ1 = toRadians(lon1);
  const λ2 = toRadians(lon2);
  
  const y = Math.sin(λ2 - λ1) * Math.cos(φ2);
  const x = Math.cos(φ1) * Math.sin(φ2) - Math.sin(φ1) * Math.cos(φ2) * Math.cos(λ2 - λ1);
  
  const θ = Math.atan2(y, x);
  const bearing = (θ * 180 / Math.PI + 360) % 360;
  
  return bearing;
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

// Calculate bounds for a set of coordinates, optionally including the current location
export function calculateBounds(coordinates: Coordinates[], currentLocation?: Coordinates): MapBounds {
  if (coordinates.length === 0 && !currentLocation) {
    // Default to SF Bay Area if no coordinates
    return {
      north: 37.8,
      south: 37.7,
      east: -122.3,
      west: -122.5,
    };
  }
  
  let allCoordinates = [...coordinates];
  
  // Add current location to the bounds calculation if provided
  if (currentLocation) {
    allCoordinates.push(currentLocation);
  }
  
  const bounds = allCoordinates.reduce(
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
