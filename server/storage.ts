import { type User, type InsertUser, type Flight, type InsertFlight, type Booking, type InsertBooking, type FlightSearch } from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Flight operations
  searchFlights(criteria: FlightSearch): Promise<Flight[]>;
  getFlightById(id: string): Promise<Flight | undefined>;
  createFlight(flight: InsertFlight): Promise<Flight>;
  updateFlightSeats(flightId: string, seatsBooked: number): Promise<void>;

  // Booking operations
  createBooking(booking: InsertBooking): Promise<Booking>;
  getBookingById(id: string): Promise<Booking | undefined>;
  getBookingsByUserId(userId: string): Promise<Booking[]>;
  getUserBookingHistory(userId: string): Promise<(Booking & { flight: Flight })[]>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private flights: Map<string, Flight>;
  private bookings: Map<string, Booking>;

  constructor() {
    this.users = new Map();
    this.flights = new Map();
    this.bookings = new Map();
    this.initializeData();
  }

  private initializeData() {
    // Add sample users
    const sampleUsers: User[] = [
      {
        id: "123e4567-e89b-12d3-a456-426614174000",
        fullName: "John Doe",
        email: "john.doe@example.com",
        passwordHash: "$2b$10$hashedpassword123",
        createdAt: new Date("2025-01-01T00:00:00Z"),
      },
      {
        id: "987fcdeb-51a2-43d1-9c47-123456789abc",
        fullName: "Jane Smith",
        email: "jane.smith@example.com",
        passwordHash: "$2b$10$hashedpassword456",
        createdAt: new Date("2025-01-02T00:00:00Z"),
      },
    ];

    sampleUsers.forEach(user => this.users.set(user.id, user));

    // Add sample flights
    const sampleFlights: Flight[] = [
      {
        id: "550e8400-e29b-41d4-a716-446655440000",
        flightNumber: "AI101",
        airlineName: "Air India",
        departureCity: "Delhi",
        arrivalCity: "Mumbai",
        departureTime: new Date("2025-09-10T08:30:00Z"),
        arrivalTime: new Date("2025-09-10T10:45:00Z"),
        durationMinutes: 135,
        price: "4500.00",
        seatsAvailable: 45,
        createdAt: new Date(),
      },
      {
        id: "661f9511-f3ac-52e5-b827-557766551111",
        flightNumber: "6E202",
        airlineName: "IndiGo",
        departureCity: "Bangalore",
        arrivalCity: "Chennai",
        departureTime: new Date("2025-09-11T14:15:00Z"),
        arrivalTime: new Date("2025-09-11T15:30:00Z"),
        durationMinutes: 75,
        price: "3200.00",
        seatsAvailable: 32,
        createdAt: new Date(),
      },
      {
        id: "772fa622-g4bd-63f6-c938-668877662222",
        flightNumber: "SG303",
        airlineName: "SpiceJet",
        departureCity: "Delhi",
        arrivalCity: "Kolkata",
        departureTime: new Date("2025-09-10T12:00:00Z"),
        arrivalTime: new Date("2025-09-10T14:20:00Z"),
        durationMinutes: 140,
        price: "3800.00",
        seatsAvailable: 28,
        createdAt: new Date(),
      },
      {
        id: "883fb733-h5ce-74g7-d049-779988773333",
        flightNumber: "AI505",
        airlineName: "Air India",
        departureCity: "Mumbai",
        arrivalCity: "Delhi",
        departureTime: new Date("2025-09-12T16:45:00Z"),
        arrivalTime: new Date("2025-09-12T18:30:00Z"),
        durationMinutes: 105,
        price: "4200.00",
        seatsAvailable: 52,
        createdAt: new Date(),
      },
      {
        id: "994gc844-i6df-85h8-e150-880099884444",
        flightNumber: "UK707",
        airlineName: "Vistara",
        departureCity: "Hyderabad",
        arrivalCity: "Pune",
        departureTime: new Date("2025-09-13T09:15:00Z"),
        arrivalTime: new Date("2025-09-13T10:45:00Z"),
        durationMinutes: 90,
        price: "3500.00",
        seatsAvailable: 38,
        createdAt: new Date(),
      },
      {
        id: "aa5hd955-j7eg-96i9-f261-991100995555",
        flightNumber: "6E808",
        airlineName: "IndiGo",
        departureCity: "Chennai",
        arrivalCity: "Bangalore",
        departureTime: new Date("2025-09-14T18:30:00Z"),
        arrivalTime: new Date("2025-09-14T19:45:00Z"),
        durationMinutes: 75,
        price: "3100.00",
        seatsAvailable: 41,
        createdAt: new Date(),
      },
      {
        id: "bb6ie066-k8fh-a7j0-g372-aa2211aa6666",
        flightNumber: "G8909",
        airlineName: "Go First",
        departureCity: "Jaipur",
        arrivalCity: "Mumbai",
        departureTime: new Date("2025-09-15T11:20:00Z"),
        arrivalTime: new Date("2025-09-15T13:10:00Z"),
        durationMinutes: 110,
        price: "3600.00",
        seatsAvailable: 25,
        createdAt: new Date(),
      },
      {
        id: "cc7jf177-l9gi-b8k1-h483-bb3322bb7777",
        flightNumber: "AI201",
        airlineName: "Air India",
        departureCity: "Kolkata",
        arrivalCity: "Delhi",
        departureTime: new Date("2025-09-16T07:45:00Z"),
        arrivalTime: new Date("2025-09-16T10:05:00Z"),
        durationMinutes: 140,
        price: "3900.00",
        seatsAvailable: 33,
        createdAt: new Date(),
      },
      {
        id: "dd8kg288-m0hj-c9l2-i594-cc4433cc8888",
        flightNumber: "UK456",
        airlineName: "Vistara",
        departureCity: "Pune",
        arrivalCity: "Hyderabad",
        departureTime: new Date("2025-09-17T13:30:00Z"),
        arrivalTime: new Date("2025-09-17T15:00:00Z"),
        durationMinutes: 90,
        price: "3400.00",
        seatsAvailable: 47,
        createdAt: new Date(),
      },
      {
        id: "ee9lh399-n1ik-d0m3-j6a5-dd5544dd9999",
        flightNumber: "SG123",
        airlineName: "SpiceJet",
        departureCity: "Mumbai",
        arrivalCity: "Bangalore",
        departureTime: new Date("2025-09-18T20:15:00Z"),
        arrivalTime: new Date("2025-09-18T22:30:00Z"),
        durationMinutes: 135,
        price: "4100.00",
        seatsAvailable: 29,
        createdAt: new Date(),
      },
    ];

    sampleFlights.forEach(flight => this.flights.set(flight.id, flight));
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.email === email);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date()
    };
    this.users.set(id, user);
    return user;
  }

  async searchFlights(criteria: FlightSearch): Promise<Flight[]> {
    const searchDate = new Date(criteria.date);
    const flights = Array.from(this.flights.values()).filter(flight => {
      const flightDate = new Date(flight.departureTime);
      const isSameDate = flightDate.toDateString() === searchDate.toDateString();
      const matchesOrigin = flight.departureCity.toLowerCase().includes(criteria.origin.toLowerCase());
      const matchesDestination = flight.arrivalCity.toLowerCase().includes(criteria.destination.toLowerCase());
      
      return isSameDate && matchesOrigin && matchesDestination;
    });

    return flights.sort((a, b) => a.departureTime.getTime() - b.departureTime.getTime());
  }

  async getFlightById(id: string): Promise<Flight | undefined> {
    return this.flights.get(id);
  }

  async createFlight(insertFlight: InsertFlight): Promise<Flight> {
    const id = randomUUID();
    const flight: Flight = {
      ...insertFlight,
      id,
      createdAt: new Date(),
    };
    this.flights.set(id, flight);
    return flight;
  }

  async updateFlightSeats(flightId: string, seatsBooked: number): Promise<void> {
    const flight = this.flights.get(flightId);
    if (flight) {
      flight.seatsAvailable -= seatsBooked;
      this.flights.set(flightId, flight);
    }
  }

  async createBooking(insertBooking: InsertBooking): Promise<Booking> {
    const id = randomUUID();
    const bookingReference = this.generateBookingReference();
    const seatNumber = this.generateSeatNumber();
    
    const booking: Booking = {
      ...insertBooking,
      id,
      bookingReference,
      seatNumber,
      status: insertBooking.status || "confirmed",
      createdAt: new Date(),
    };
    
    this.bookings.set(id, booking);
    
    // Update flight seats
    await this.updateFlightSeats(insertBooking.flightId, 1);
    
    return booking;
  }

  async getBookingById(id: string): Promise<Booking | undefined> {
    return this.bookings.get(id);
  }

  async getBookingsByUserId(userId: string): Promise<Booking[]> {
    return Array.from(this.bookings.values()).filter(booking => booking.userId === userId);
  }

  async getUserBookingHistory(userId: string): Promise<(Booking & { flight: Flight })[]> {
    const userBookings = await this.getBookingsByUserId(userId);
    const bookingsWithFlights = await Promise.all(
      userBookings.map(async (booking) => {
        const flight = await this.getFlightById(booking.flightId);
        return { ...booking, flight: flight! };
      })
    );
    
    return bookingsWithFlights.filter(booking => booking.flight);
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

import { DBStorage } from "./dbStorage";

// Use database storage if DATABASE_URL is available, otherwise use in-memory storage
export const storage = process.env.DATABASE_URL ? new DBStorage() : new MemStorage();
