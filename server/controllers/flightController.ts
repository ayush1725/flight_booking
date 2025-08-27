import { Request, Response } from "express";
import { storage } from "../storage";
import { flightSearchSchema } from "@shared/schema";
import { logger } from "../utils/logger";

export class FlightController {
  static async searchFlights(req: Request, res: Response) {
    try {
      const validatedQuery = flightSearchSchema.parse(req.query);
      
      const flights = await storage.searchFlights(validatedQuery);
      
      logger.info(`Flight search: ${validatedQuery.origin} to ${validatedQuery.destination} on ${validatedQuery.date} - Found ${flights.length} flights`);
      
      res.json({
        success: true,
        data: flights,
        count: flights.length
      });
    } catch (error) {
      logger.error("Flight search error:", error);
      res.status(400).json({
        success: false,
        message: error instanceof Error ? error.message : "Invalid search parameters"
      });
    }
  }

  static async getFlightById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({
          success: false,
          message: "Flight ID is required"
        });
      }

      const flight = await storage.getFlightById(id);
      
      if (!flight) {
        return res.status(404).json({
          success: false,
          message: "Flight not found"
        });
      }

      logger.info(`Flight details retrieved for ID: ${id}`);
      
      res.json({
        success: true,
        data: flight
      });
    } catch (error) {
      logger.error("Get flight by ID error:", error);
      res.status(500).json({
        success: false,
        message: "Internal server error"
      });
    }
  }
}
