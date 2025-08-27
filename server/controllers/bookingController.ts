import { Request, Response } from "express";
import { storage } from "../storage";
import { insertBookingSchema } from "@shared/schema";
import { logger } from "../utils/logger";

export class BookingController {
  static async createBooking(req: Request, res: Response) {
    try {
      const validatedData = insertBookingSchema.parse(req.body);
      
      // Check if flight exists and has available seats
      const flight = await storage.getFlightById(validatedData.flightId);
      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found"
        });
      }

      if (flight.seatsAvailable <= 0) {
        return res.status(400).json({
          success: false,
          message: "No seats available on this flight"
        });
      }

      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User not found"
        });
      }

      const booking = await storage.createBooking(validatedData);
      
      logger.info(`Booking created: ${booking.bookingReference} for user ${user.fullName}`);
      
      res.status(201).json({
        success: true,
        data: {
          booking_id: booking.id,
          booking_reference: booking.bookingReference,
          status: booking.status,
          total_price: booking.totalPrice,
          seat_number: booking.seatNumber,
          passenger_name: booking.passengerName,
          flight: {
            flight_number: flight.flightNumber,
            airline_name: flight.airlineName,
            departure_city: flight.departureCity,
            arrival_city: flight.arrivalCity,
            departure_time: flight.departureTime,
            arrival_time: flight.arrivalTime
          }
        }
      });
    } catch (error) {
      logger.error("Create booking error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Invalid booking data"
      });
    }
  }

  static async getBookingById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Booking ID is required"
        });
      }

      const booking = await storage.getBookingById(id);
      
      if (!booking) {
        return res.status(404).json({
          success: false,
          message: "Booking not found"
        });
      }

      // Get flight details
      const flight = await storage.getFlightById(booking.flightId);
      if (!flight) {
        return res.status(500).json({
          success: false,
          message: "Associated flight not found"
        });
      }

      // Get user details
      const user = await storage.getUser(booking.userId);
      if (!user) {
        return res.status(500).json({
          success: false,
          message: "Associated user not found"
        });
      }

      logger.info(`Booking details retrieved for ID: ${id}`);
      
      res.json({
        success: true,
        data: {
          booking: {
            id: booking.id,
            booking_reference: booking.bookingReference,
            passenger_name: booking.passengerName,
            passenger_age: booking.passengerAge,
            passport_number: booking.passportNumber,
            seat_number: booking.seatNumber,
            total_price: booking.totalPrice,
            status: booking.status,
            created_at: booking.createdAt
          },
          flight: {
            flight_number: flight.flightNumber,
            airline_name: flight.airlineName,
            departure_city: flight.departureCity,
            arrival_city: flight.arrivalCity,
            departure_time: flight.departureTime,
            arrival_time: flight.arrivalTime,
            duration_minutes: flight.durationMinutes
          },
          user: {
            full_name: user.fullName,
            email: user.email
          }
        }
      });
    } catch (error) {
      logger.error("Get booking by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
