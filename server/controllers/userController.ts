import { Request, Response } from "express";
import { storage } from "../storage";
import { logger } from "../utils/logger";

export class UserController {
  static async getUserProfile(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      // Get user's booking history
      const bookings = await storage.getBookingsByUserId(id);

      logger.info(`User profile retrieved for ID: ${id}`);
      
      res.json({
        success: true,
        data: {
          id: user.id,
          full_name: user.fullName,
          email: user.email,
          created_at: user.createdAt,
          total_bookings: bookings.length
        }
      });
    } catch (error) {
      logger.error("Get user profile error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }

  static async getUserBookings(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "User ID is required"
        });
      }

      const user = await storage.getUser(id);
      
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const bookingsWithFlights = await storage.getUserBookingHistory(id);

      logger.info(`User booking history retrieved for ID: ${id} - ${bookingsWithFlights.length} bookings found`);
      
      res.json({
        success: true,
        data: bookingsWithFlights.map(booking => ({
          booking: {
            id: booking.id,
            booking_reference: booking.bookingReference,
            passenger_name: booking.passengerName,
            seat_number: booking.seatNumber,
            total_price: booking.totalPrice,
            status: booking.status,
            created_at: booking.createdAt
          },
          flight: {
            flight_number: booking.flight.flightNumber,
            airline_name: booking.flight.airlineName,
            departure_city: booking.flight.departureCity,
            arrival_city: booking.flight.arrivalCity,
            departure_time: booking.flight.departureTime,
            arrival_time: booking.flight.arrivalTime
          }
        })),
        count: bookingsWithFlights.length
      });
    } catch (error) {
      logger.error("Get user bookings error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
