import type { Express } from "express";
import { createServer, type Server } from "http";
import cors from "cors";
import { FlightController } from "./controllers/flightController";
import { BookingController } from "./controllers/bookingController";
import { UserController } from "./controllers/userController";
import { validateQuery, validateRequest } from "./middleware/validation";
import { errorHandler, notFoundHandler } from "./middleware/errorHandler";
import { authenticateToken, requireOwnership } from "./middleware/authMiddleware";
import authRoutes from "./routes/authRoutes";
import { flightSearchSchema, insertBookingSchema } from "@shared/schema";
import { logger } from "./utils/logger";

export async function registerRoutes(app: Express): Promise<Server> {
  // Enable CORS for frontend access
  app.use(cors({
    origin: process.env.FRONTEND_URL || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"]
  }));

  // Health check endpoint
  app.get("/api/health", (req, res) => {
    logger.info("Health check requested");
    res.json({
      success: true,
      message: "Flight Booking API is running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Authentication routes
  app.use("/api/auth", authRoutes);

  // Flight routes
  app.get(
    "/api/flights",
    validateQuery(flightSearchSchema),
    FlightController.searchFlights
  );

  app.get(
    "/api/flights/:id",
    FlightController.getFlightById
  );

  // Booking routes
  app.post(
    "/api/bookings",
    validateRequest(insertBookingSchema),
    BookingController.createBooking
  );

  app.get(
    "/api/bookings/:id",
    BookingController.getBookingById
  );

  // User routes (protected - users can only access their own data)
  app.get(
    "/api/users/:id",
    authenticateToken,
    requireOwnership(),
    UserController.getUserProfile
  );

  app.get(
    "/api/users/:id/bookings",
    authenticateToken,
    requireOwnership(),
    UserController.getUserBookings
  );

  // API documentation endpoint
  app.get("/api", (req, res) => {
    res.json({
      success: true,
      message: "Flight Booking API",
      version: "1.0.0",
      endpoints: {
        flights: {
          "GET /api/flights": "Search flights with query parameters (origin, destination, date)",
          "GET /api/flights/:id": "Get flight details by ID"
        },
        bookings: {
          "POST /api/bookings": "Create new booking",
          "GET /api/bookings/:id": "Get booking details by ID"
        },
        users: {
          "GET /api/users/:id": "Get user profile",
          "GET /api/users/:id/bookings": "Get user booking history"
        }
      },
      documentation: "See README.md for detailed API documentation"
    });
  });

  // 404 handler for unmatched API routes
  app.use("/api/*", notFoundHandler);

  // Global error handler
  app.use(errorHandler);

  const httpServer = createServer(app);

  logger.info("API routes registered successfully");
  return httpServer;
}
