import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { Address, DeliveryStatus, InsertAddress, InsertRoute, InsertRouteSettings, Priority, Route, RouteSettings, TimeWindow } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize storage with default route settings if none exist
  const initDefaultRouteSettings = async () => {
    const settings = await storage.getRouteSettings();
    if (!settings) {
      await storage.createRouteSettings({
        shortestDistance: true,
        realTimeTraffic: true,
        avoidHighways: false,
        avoidTolls: false,
        minimizeLeftTurns: false,
        startingPoint: "Current Location",
        returnToStart: false,
      });
    }
  };
  
  initDefaultRouteSettings();

  // === Address Routes ===
  
  // Get all addresses
  app.get("/api/addresses", async (req, res) => {
    try {
      const addresses = await storage.getAllAddresses();
      res.json(addresses);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get a specific address
  app.get("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const address = await storage.getAddress(id);
      
      if (!address) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(address);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Create a new address
  app.post("/api/addresses", async (req, res) => {
    try {
      const addressData: InsertAddress = {
        fullAddress: req.body.fullAddress,
        timeWindow: req.body.timeWindow || TimeWindow.ANY,
        priority: req.body.priority || Priority.NORMAL,
        specialInstructions: req.body.specialInstructions || "",
      };
      
      const newAddress = await storage.createAddress(addressData);
      res.status(201).json(newAddress);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Update an address
  app.patch("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const addressData: Partial<Address> = req.body;
      
      const updatedAddress = await storage.updateAddress(id, addressData);
      
      if (!updatedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Delete an address
  app.delete("/api/addresses/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAddress(id);
      
      if (!success) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Bulk import addresses
  app.post("/api/addresses/bulk", async (req, res) => {
    try {
      const addresses: InsertAddress[] = req.body;
      
      if (!Array.isArray(addresses)) {
        return res.status(400).json({ message: "Expected an array of addresses" });
      }
      
      const results = await Promise.all(
        addresses.map(addr => storage.createAddress(addr))
      );
      
      res.status(201).json({ success: true, count: results.length });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Update address status
  app.patch("/api/addresses/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;
      
      // Validate status
      if (!Object.values(DeliveryStatus).includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      const updatedAddress = await storage.updateAddress(id, { 
        status,
        deliveredAt: status === DeliveryStatus.DELIVERED ? new Date() : undefined
      });
      
      if (!updatedAddress) {
        return res.status(404).json({ message: "Address not found" });
      }
      
      res.json(updatedAddress);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // === Route Settings Routes ===
  
  // Get route settings
  app.get("/api/route-settings", async (req, res) => {
    try {
      const settings = await storage.getRouteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Route settings not found" });
      }
      
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Update route settings
  app.patch("/api/route-settings", async (req, res) => {
    try {
      const settingsData: Partial<RouteSettings> = req.body;
      
      const settings = await storage.getRouteSettings();
      
      if (!settings) {
        return res.status(404).json({ message: "Route settings not found" });
      }
      
      const updatedSettings = await storage.updateRouteSettings(settingsData);
      
      res.json(updatedSettings);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // === Routes Routes ===
  
  // Get all routes
  app.get("/api/routes", async (req, res) => {
    try {
      const routes = await storage.getAllRoutes();
      res.json(routes);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Get a specific route
  app.get("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const route = await storage.getRoute(id);
      
      if (!route) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(route);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Create a new route
  app.post("/api/routes", async (req, res) => {
    try {
      const routeData: InsertRoute = {
        totalDistance: req.body.totalDistance,
        totalTime: req.body.totalTime,
        fuelUsed: req.body.fuelUsed,
        completed: req.body.completed || false,
      };
      
      const newRoute = await storage.createRoute(routeData);
      res.status(201).json(newRoute);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Update a route
  app.patch("/api/routes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const routeData: Partial<Route> = req.body;
      
      const updatedRoute = await storage.updateRoute(id, routeData);
      
      if (!updatedRoute) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(updatedRoute);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Mark a route as complete
  app.patch("/api/routes/:id/complete", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      
      const updatedRoute = await storage.updateRoute(id, { completed: true });
      
      if (!updatedRoute) {
        return res.status(404).json({ message: "Route not found" });
      }
      
      res.json(updatedRoute);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });
  
  // Optimize a route (reorder addresses for efficiency)
  app.post("/api/routes/optimize", async (req, res) => {
    try {
      const addresses = await storage.getAllAddresses();
      
      // In a real implementation, this would use an actual routing API
      // to determine the optimal order of addresses
      
      // For now, we'll do a simple simulation
      const optimizedAddresses = [...addresses];
      
      // Update the sequence for each address
      for (let i = 0; i < optimizedAddresses.length; i++) {
        await storage.updateAddress(optimizedAddresses[i].id, { sequence: i });
      }
      
      res.json({ success: true, message: "Route optimized" });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
