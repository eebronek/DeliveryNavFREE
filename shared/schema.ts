import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const addresses = pgTable("addresses", {
  id: serial("id").primaryKey(),
  fullAddress: text("full_address").notNull(),
  latitude: text("latitude"),
  longitude: text("longitude"),
  timeWindow: text("time_window").default("Any time"),
  priority: text("priority").default("Normal"),
  specialInstructions: text("special_instructions"),
  userId: integer("user_id").references(() => users.id),
  status: text("status").default("Pending"),
  deliveredAt: timestamp("delivered_at"),
  sequence: integer("sequence"),
});

export const insertAddressSchema = createInsertSchema(addresses).pick({
  fullAddress: true,
  timeWindow: true,
  priority: true,
  specialInstructions: true,
  userId: true,
});

export const routeSettings = pgTable("route_settings", {
  id: serial("id").primaryKey(),
  shortestDistance: boolean("shortest_distance").default(true),
  realTimeTraffic: boolean("real_time_traffic").default(true),
  avoidHighways: boolean("avoid_highways").default(false),
  avoidTolls: boolean("avoid_tolls").default(false),
  minimizeLeftTurns: boolean("minimize_left_turns").default(false),
  startingPoint: text("starting_point").default("Current Location"),
  returnToStart: boolean("return_to_start").default(false),
  userId: integer("user_id").references(() => users.id),
});

export const insertRouteSettingsSchema = createInsertSchema(routeSettings).pick({
  shortestDistance: true,
  realTimeTraffic: true,
  avoidHighways: true,
  avoidTolls: true,
  minimizeLeftTurns: true,
  startingPoint: true,
  returnToStart: true,
  userId: true,
});

export const routes = pgTable("routes", {
  id: serial("id").primaryKey(),
  totalDistance: text("total_distance"),
  totalTime: text("total_time"),
  fuelUsed: text("fuel_used"),
  userId: integer("user_id").references(() => users.id),
  completed: boolean("completed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRouteSchema = createInsertSchema(routes).pick({
  totalDistance: true,
  totalTime: true,
  fuelUsed: true,
  userId: true,
  completed: true,
});

// Types based on schema
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertAddress = z.infer<typeof insertAddressSchema>;
export type Address = typeof addresses.$inferSelect;

export type InsertRouteSettings = z.infer<typeof insertRouteSettingsSchema>;
export type RouteSettings = typeof routeSettings.$inferSelect;

export type InsertRoute = z.infer<typeof insertRouteSchema>;
export type Route = typeof routes.$inferSelect;

// Custom types for application

export enum DeliveryStatus {
  PENDING = "Pending",
  DELIVERED = "Delivered",
  FAILED = "Failed",
  ATTEMPTED = "Attempted",
}

export enum TimeWindow {
  ANY = "Any time",
  MORNING = "Morning (8AM-12PM)",
  AFTERNOON = "Afternoon (12PM-5PM)",
  EVENING = "Evening (5PM-8PM)",
}

export enum Priority {
  HIGH = "High",
  NORMAL = "Normal",
  LOW = "Low",
}
