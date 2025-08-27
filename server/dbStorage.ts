import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { users, flights, bookings } from "@shared/schema";
import { eq, and, gte, lte, like, sql } from "drizzle-orm";
import type { User, InsertUser, Flight, InsertFlight, Booking, InsertBooking, FlightSearch } from "@shared/schema";
import { IStorage } from "./storage";

// Initialize database connection
const connectionString = process.env.DATABASE_URL!;
const client = neon(connectionString);
const db = drizzle(client);

export class DBStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async searchFlights(criteria: FlightSearch): Promise<Flight[]> {
    const searchDate = new Date(criteria.date);
    const nextDay = new Date(searchDate);
    nextDay.setDate(searchDate.getDate() + 1);

    const result = await db
      .select()
      .from(flights)
      .where(
        and(
          gte(flights.departureTime, searchDate),
          lte(flights.departureTime, nextDay),
          like(flights.departureCity, `%${criteria.origin}%`),
          like(flights.arrivalCity, `%${criteria.destination}%`)
        )
      )
      .orderBy(flights.departureTime);

    return result;
  }

  async getFlightById(id: string): Promise<Flight | undefined> {
    const result = await db.select().from(flights).where(eq(flights.id, id)).limit(1);
    return result[0];
  }

  async createFlight(insertFlight: InsertFlight): Promise<Flight> {
    const result = await db.insert(flights).values(insertFlight).returning();
    return result[0];
  }

  async updateFlightSeats(flightId: string, seatsBooked: number): Promise<void> {
    await db
      .update(flights)
      .set({ 
        seatsAvailable: sql`${flights.seatsAvailable} - ${seatsBooked}`
      })
      .where(eq(flights.id, flightId));
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const bookingReference = this.generateBookingReference();
    const seatNumber = this.generateSeatNumber();
    
    const bookingData = {
      ...insertBooking,
      bookingReference,
      seatNumber,
      status: insertBooking.status || "confirmed"
    };

    const result = await db.insert(bookings).values(bookingData).returning();
    
    // Update flight seats
    await this.updateFlightSeats(insertBooking.flightId, 1);
    
    return result[0];
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    const result = await db.select().from(bookings).where(eq(bookings.id, id)).limit(1);
    return result[0];
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    const result = await db.select().from(bookings).where(eq(bookings.userId, userId));
    return result;
  }

  async getUserBookingHistory(userId: string): Promise<(Booking & { flight: Flight })[]> {
    const result = await db
      .select()
      .from(bookings)
      .innerJoin(flights, eq(bookings.flightId, flights.id))
      .where(eq(bookings.userId, userId));

    return result.map(row => ({
      ...row.bookings,
      flight: row.flights
    }));
  }

  private generateBookingReference(): string {
    const prefix = "FB2025";
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substr(2, 3).toUpperCase();
    return `${prefix}-${timestamp}-${random}`;
  }

  private generateSeatNumber(): string {
    const rows = Math.floor(Math.random() * 30) + 1;
    const seats = ['A', 'B', 'C', 'D', 'E', 'F'];
    const seatLetter = seats[Math.floor(Math.random() * seats.length)];
    return `${rows}${seatLetter}`;
  }
}