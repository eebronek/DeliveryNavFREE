import { 
  Address, 
  DeliveryStatus, 
  Priority, 
  Route, 
  RouteSettings, 
  TimeWindow 
} from "@shared/schema";

export interface AddressWithCoordinates extends Address {
  position: [number, number]; // [latitude, longitude]
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
}

export interface OptimizedRoute {
  waypoints: AddressWithCoordinates[];
  totalDistance: string;
  totalDuration: string;
  totalFuel: string;
  steps: RouteStep[];
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface CSVRow {
  address: string;
  timeWindow?: string;
  priority?: string;
  specialInstructions?: string;
}
