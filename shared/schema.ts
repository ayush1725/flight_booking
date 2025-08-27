import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, integer, decimal, uuid } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table
export const users = pgTable("users", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash", { length: 255 }).notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Flights table
export const flights = pgTable("flights", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  flightNumber: varchar("flight_number", { length: 10 }).notNull(),
  airlineName: varchar("airline_name", { length: 100 }).notNull(),
  departureCity: varchar("departure_city", { length: 100 }).notNull(),
  arrivalCity: varchar("arrival_city", { length: 100 }).notNull(),
  departureTime: timestamp("departure_time").notNull(),
  arrivalTime: timestamp("arrival_time").notNull(),
  durationMinutes: integer("duration_minutes").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  seatsAvailable: integer("seats_available").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Bookings table
export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
  flightId: uuid("flight_id").references(() => flights.id, { onDelete: "cascade" }).notNull(),
  bookingReference: varchar("booking_reference", { length: 50 }).notNull().unique(),
  passengerName: varchar("passenger_name", { length: 255 }).notNull(),
  passengerAge: integer("passenger_age").notNull(),
  passportNumber: varchar("passport_number", { length: 20 }).notNull(),
  seatNumber: varchar("seat_number", { length: 10 }),
  totalPrice: decimal("total_price", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 20 }).default("confirmed").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`).notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
});

export const insertFlightSchema = createInsertSchema(flights).omit({
  id: true,
  createdAt: true,
});

export const insertBookingSchema = createInsertSchema(bookings).omit({
  id: true,
  bookingReference: true,
  seatNumber: true,
  createdAt: true,
});

// Search schemas
export const flightSearchSchema = z.object({
  origin: z.string().min(1, "Origin is required"),
  destination: z.string().min(1, "Destination is required"),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Flight = typeof flights.$inferSelect;
export type InsertFlight = z.infer<typeof insertFlightSchema>;

export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = z.infer<typeof insertBookingSchema>;

export type FlightSearch = z.infer<typeof flightSearchSchema>;
