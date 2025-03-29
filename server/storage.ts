import { 
  User, InsertUser, 
  Address, InsertAddress, DeliveryStatus,
  RouteSettings, InsertRouteSettings,
  Route, InsertRoute 
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Address methods
  getAllAddresses(): Promise<Address[]>;
  getAddress(id: number): Promise<Address | undefined>;
  createAddress(address: InsertAddress): Promise<Address>;
  updateAddress(id: number, data: Partial<Address>): Promise<Address | undefined>;
  deleteAddress(id: number): Promise<boolean>;
  
  // Route Settings methods
  getRouteSettings(): Promise<RouteSettings | undefined>;
  createRouteSettings(settings: InsertRouteSettings): Promise<RouteSettings>;
  updateRouteSettings(data: Partial<RouteSettings>): Promise<RouteSettings | undefined>;
  
  // Route methods
  getAllRoutes(): Promise<Route[]>;
  getRoute(id: number): Promise<Route | undefined>;
  createRoute(route: InsertRoute): Promise<Route>;
  updateRoute(id: number, data: Partial<Route>): Promise<Route | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private addresses: Map<number, Address>;
  private routes: Map<number, Route>;
  private routeSettings?: RouteSettings;
  
  private userId: number;
  private addressId: number;
  private routeId: number;
  private routeSettingsId: number;

  constructor() {
    this.users = new Map();
    this.addresses = new Map();
    this.routes = new Map();
    
    this.userId = 1;
    this.addressId = 1;
    this.routeId = 1;
    this.routeSettingsId = 1;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Address methods
  async getAllAddresses(): Promise<Address[]> {
    return Array.from(this.addresses.values()).sort((a, b) => (a.sequence || 0) - (b.sequence || 0));
  }
  
  async getAddress(id: number): Promise<Address | undefined> {
    return this.addresses.get(id);
  }
  
  async createAddress(address: InsertAddress): Promise<Address> {
    const id = this.addressId++;
    const now = new Date();
    const newAddress: Address = {
      ...address,
      id,
      createdAt: now,
      updatedAt: now,
      status: DeliveryStatus.PENDING,
      sequence: this.addresses.size,
      deliveredAt: undefined,
    };
    this.addresses.set(id, newAddress);
    return newAddress;
  }
  
  async updateAddress(id: number, data: Partial<Address>): Promise<Address | undefined> {
    const address = this.addresses.get(id);
    if (!address) {
      return undefined;
    }
    
    const updatedAddress = {
      ...address,
      ...data,
      updatedAt: new Date(),
    };
    
    this.addresses.set(id, updatedAddress);
    return updatedAddress;
  }
  
  async deleteAddress(id: number): Promise<boolean> {
    return this.addresses.delete(id);
  }
  
  // Route Settings methods
  async getRouteSettings(): Promise<RouteSettings | undefined> {
    return this.routeSettings;
  }
  
  async createRouteSettings(settings: InsertRouteSettings): Promise<RouteSettings> {
    const id = this.routeSettingsId;
    const now = new Date();
    
    const newSettings: RouteSettings = {
      ...settings,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.routeSettings = newSettings;
    return newSettings;
  }
  
  async updateRouteSettings(data: Partial<RouteSettings>): Promise<RouteSettings | undefined> {
    if (!this.routeSettings) {
      return undefined;
    }
    
    const updatedSettings = {
      ...this.routeSettings,
      ...data,
      updatedAt: new Date(),
    };
    
    this.routeSettings = updatedSettings;
    return updatedSettings;
  }
  
  // Route methods
  async getAllRoutes(): Promise<Route[]> {
    return Array.from(this.routes.values()).sort((a, b) => {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }
  
  async getRoute(id: number): Promise<Route | undefined> {
    return this.routes.get(id);
  }
  
  async createRoute(route: InsertRoute): Promise<Route> {
    const id = this.routeId++;
    const now = new Date();
    
    const newRoute: Route = {
      ...route,
      id,
      createdAt: now,
      updatedAt: now,
    };
    
    this.routes.set(id, newRoute);
    return newRoute;
  }
  
  async updateRoute(id: number, data: Partial<Route>): Promise<Route | undefined> {
    const route = this.routes.get(id);
    if (!route) {
      return undefined;
    }
    
    const updatedRoute = {
      ...route,
      ...data,
      updatedAt: new Date(),
    };
    
    this.routes.set(id, updatedRoute);
    return updatedRoute;
  }
}

export const storage = new MemStorage();
