import { Request, Response } from "express";
import { z } from "zod";
import { nanoid } from "nanoid";
import { storage } from "../storage";
import { insertBookingSchema } from "@shared/schema";
import { logger } from "../utils/logger";
import { PaymentService } from "../services/paymentService";
import { ETicketService } from "../services/eTicketService";

// Enhanced booking schema with payment info
const createBookingSchema = insertBookingSchema.extend({
  paymentMethod: z.enum(['card', 'paypal']).optional().default('card'),
});

const paymentIntentSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID'),
});

export class BookingController {
  // Create a new booking (before payment)
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const validatedData = createBookingSchema.parse(req.body);
      
      // Generate unique booking reference
      const bookingReference = `FB-${nanoid(8).toUpperCase()}`;
      
      // Get flight details to calculate total price
      const flight = await storage.getFlightById(validatedData.flightId);
      if (!flight) {
        res.status(404).json({
          success: false,
          message: 'Flight not found'
        });
        return;
      }
      
      // Check seat availability
      if (flight.seatsAvailable <= 0) {
        res.status(400).json({
          success: false,
          message: 'No seats available for this flight'
        });
        return;
      }
      
      // Check if user exists
      const user = await storage.getUser(validatedData.userId);
      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }
      
      // Create booking with pending status
      const bookingData = {
        ...validatedData,
        bookingReference,
        totalPrice: flight.price.toString(),
        status: 'pending' as const,
        paymentStatus: 'pending' as const,
        eTicketGenerated: false,
      };
      
      const booking = await storage.createBooking(bookingData);
      
      logger.info(`Booking created: ${bookingReference} for user ${user.fullName}`);
      
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: {
          booking,
          flight,
          nextStep: 'payment'
        }
      });
      
    } catch (error) {
      logger.error('Create booking error:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid booking data',
          errors: error.errors
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create booking',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  // Create payment intent for booking
  static async createPaymentIntent(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = paymentIntentSchema.parse(req.body);
      
      // Get booking details
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
        return;
      }
      
      // Get flight and user details
      const flight = await storage.getFlightById(booking.flightId);
      const user = await storage.getUser(booking.userId);
      
      if (!flight || !user) {
        res.status(404).json({
          success: false,
          message: 'Flight or user details not found'
        });
        return;
      }
      
      // Create Stripe payment intent
      const paymentResult = await PaymentService.createPaymentIntent({
        amount: parseFloat(booking.totalPrice),
        currency: 'usd',
        bookingReference: booking.bookingReference,
        customerEmail: user.email,
        description: `Flight booking: ${flight.flightNumber} from ${flight.departureCity} to ${flight.arrivalCity}`
      });
      
      if (!paymentResult.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to create payment intent',
          error: paymentResult.error
        });
        return;
      }
      
      // Update booking with payment intent ID
      await storage.updateBooking(bookingId, {
        paymentIntentId: paymentResult.paymentIntentId
      });
      
      res.status(200).json({
        success: true,
        message: 'Payment intent created',
        data: {
          clientSecret: paymentResult.clientSecret,
          booking,
          flight,
          totalAmount: booking.totalPrice
        }
      });
      
    } catch (error) {
      logger.error('Error creating payment intent:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to create payment intent',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Confirm payment and generate e-ticket
  static async confirmPayment(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = paymentIntentSchema.parse(req.body);
      
      // Get booking details
      const booking = await storage.getBookingById(bookingId);
      if (!booking || !booking.paymentIntentId) {
        res.status(404).json({
          success: false,
          message: 'Booking or payment intent not found'
        });
        return;
      }
      
      // Check payment status with Stripe
      const paymentStatus = await PaymentService.confirmPayment(booking.paymentIntentId);
      
      if (!paymentStatus.success) {
        res.status(500).json({
          success: false,
          message: 'Failed to verify payment status',
          error: paymentStatus.error
        });
        return;
      }
      
      // Update booking status based on payment
      const isPaymentSuccessful = paymentStatus.status === 'succeeded';
      
      await storage.updateBooking(bookingId, {
        status: isPaymentSuccessful ? 'confirmed' : 'failed',
        paymentStatus: paymentStatus.status || 'unknown'
      });
      
      if (isPaymentSuccessful) {
        // Generate e-ticket
        const [flight, user] = await Promise.all([
          storage.getFlightById(booking.flightId),
          storage.getUser(booking.userId)
        ]);
        
        if (flight && user) {
          const updatedBooking = await storage.getBookingById(bookingId);
          if (updatedBooking) {
            const ticketResult = await ETicketService.generateAndSaveETicket({
              booking: updatedBooking,
              flight,
              user
            });
            
            if (ticketResult.success) {
              await storage.updateBooking(bookingId, {
                eTicketGenerated: true
              });
              
              logger.info(`E-ticket generated for booking: ${booking.bookingReference}`);
            }
          }
        }
        
        // Update flight seat availability
        await storage.updateFlight(booking.flightId, {
          seatsAvailable: flight!.seatsAvailable - 1
        });
        
        res.status(200).json({
          success: true,
          message: 'Payment confirmed and e-ticket generated',
          data: {
            booking: await storage.getBookingById(bookingId),
            paymentStatus: paymentStatus.status,
            eTicketReady: true
          }
        });
      } else {
        res.status(400).json({
          success: false,
          message: 'Payment was not successful',
          data: {
            paymentStatus: paymentStatus.status
          }
        });
      }
      
    } catch (error) {
      logger.error('Error confirming payment:', error);
      
      if (error instanceof z.ZodError) {
        res.status(400).json({
          success: false,
          message: 'Invalid request data',
          errors: error.errors
        });
        return;
      }
      
      res.status(500).json({
        success: false,
        message: 'Failed to confirm payment',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
  
  // Download e-ticket
  static async downloadETicket(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      
      // Get booking details
      const booking = await storage.getBookingById(bookingId);
      if (!booking) {
        res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
        return;
      }
      
      // Check if booking is confirmed and e-ticket is generated
      if (booking.status !== 'confirmed' || !booking.eTicketGenerated) {
        res.status(400).json({
          success: false,
          message: 'E-ticket not available. Booking must be confirmed and payment completed.',
          data: {
            bookingStatus: booking.status,
            paymentStatus: booking.paymentStatus,
            eTicketGenerated: booking.eTicketGenerated
          }
        });
        return;
      }
      
      // Get flight and user details
      const [flight, user] = await Promise.all([
        storage.getFlightById(booking.flightId),
        storage.getUser(booking.userId)
      ]);
      
      if (!flight || !user) {
        res.status(404).json({
          success: false,
          message: 'Flight or user details not found'
        });
        return;
      }
      
      // Generate PDF e-ticket
      const pdfBuffer = await ETicketService.generateETicket({
        booking,
        flight,
        user
      });
      
      // Set headers for PDF download
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="eticket-${booking.bookingReference}.pdf"`);
      res.setHeader('Content-Length', pdfBuffer.length);
      
      // Send PDF
      res.send(pdfBuffer);
      
      logger.info(`E-ticket downloaded: ${booking.bookingReference}`);
      
    } catch (error) {
      logger.error('Error downloading e-ticket:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to generate e-ticket',
        error: error instanceof Error ? error.message : 'Unknown error'
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
  
  // Get user bookings
  static async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;
      
      const bookings = await storage.getBookingsByUserId(userId);
      
      // Get flight details for each booking
      const bookingsWithFlights = await Promise.all(
        bookings.map(async (booking) => {
          const flight = await storage.getFlightById(booking.flightId);
          return {
            ...booking,
            flight
          };
        })
      );
      
      res.status(200).json({
        success: true,
        message: 'User bookings retrieved successfully',
        data: bookingsWithFlights
      });
      
    } catch (error) {
      logger.error('Error getting user bookings:', error);
      
      res.status(500).json({
        success: false,
        message: 'Failed to retrieve bookings',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}
