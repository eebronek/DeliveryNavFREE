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

export interface TurnByTurnDirection {
  instruction: string;
  distance: number;
  turnType: string;
  streetName: string;
}

export interface RouteStep {
  instruction: string;
  distance: string;
  duration: string;
  turnType?: string;
  streetName?: string;
  isDestination?: boolean;
}

export interface OptimizedRoute {
  waypoints: AddressWithCoordinates[];
  totalDistance: string;
  totalDuration: string;
  totalFuel: string;
  steps: RouteStep[];
  coordinates?: [number, number][];
  currentLocation?: Coordinates;
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
  exactDeliveryTime?: string;
  priority?: string;
  specialInstructions?: string;
}
