import { storage } from "../server/storage";
import { logger } from "../server/utils/logger";
import type { InsertFlight, InsertUser } from "@shared/schema";

const sampleUsers: InsertUser[] = [
  {
    fullName: "Alice Johnson",
    email: "alice.johnson@example.com",
    passwordHash: "$2b$10$hashedpassword001",
  },
  {
    fullName: "Bob Williams",
    email: "bob.williams@example.com", 
    passwordHash: "$2b$10$hashedpassword002",
  },
  {
    fullName: "Carol Davis",
    email: "carol.davis@example.com",
    passwordHash: "$2b$10$hashedpassword003",
  },
];

const sampleFlights: InsertFlight[] = [
  {
    flightNumber: "AI106",
    airlineName: "Air India",
    departureCity: "Delhi",
    arrivalCity: "Goa",
    departureTime: new Date("2025-09-20T06:30:00Z"),
    arrivalTime: new Date("2025-09-20T08:45:00Z"),
    durationMinutes: 135,
    price: "5200.00",
    seatsAvailable: 42,
  },
  {
    flightNumber: "6E445",
    airlineName: "IndiGo",
    departureCity: "Mumbai",
    arrivalCity: "Kochi",
    departureTime: new Date("2025-09-21T11:20:00Z"),
    arrivalTime: new Date("2025-09-21T13:05:00Z"),
    durationMinutes: 105,
    price: "3900.00",
    seatsAvailable: 38,
  },
  {
    flightNumber: "UK789",
    airlineName: "Vistara",
    departureCity: "Bangalore",
    arrivalCity: "Delhi",
    departureTime: new Date("2025-09-22T19:15:00Z"),
    arrivalTime: new Date("2025-09-22T22:00:00Z"),
    durationMinutes: 165,
    price: "6100.00",
    seatsAvailable: 55,
  },
  {
    flightNumber: "SG567",
    airlineName: "SpiceJet", 
    departureCity: "Chennai",
    arrivalCity: "Hyderabad",
    departureTime: new Date("2025-09-23T14:40:00Z"),
    arrivalTime: new Date("2025-09-23T15:55:00Z"),
    durationMinutes: 75,
    price: "2800.00",
    seatsAvailable: 30,
  },
  {
    flightNumber: "G8234",
    airlineName: "Go First",
    departureCity: "Ahmedabad",
    arrivalCity: "Mumbai",
    departureTime: new Date("2025-09-24T09:10:00Z"),
    arrivalTime: new Date("2025-09-24T10:25:00Z"),
    durationMinutes: 75,
    price: "3200.00",
    seatsAvailable: 25,
  },
];

async function seedDatabase() {
  try {
    logger.info("Starting database seeding...");

    // Seed additional users
    let userCount = 0;
    for (const userData of sampleUsers) {
      try {
        const existingUser = await storage.getUserByEmail(userData.email);
        if (!existingUser) {
          await storage.createUser(userData);
          userCount++;
        } else {
          logger.info(`User ${userData.email} already exists, skipping...`);
        }
      } catch (error) {
        logger.error(`Error creating user ${userData.email}:`, error);
      }
    }

    // Seed additional flights
    let flightCount = 0;
    for (const flightData of sampleFlights) {
      try {
        await storage.createFlight(flightData);
        flightCount++;
      } catch (error) {
        logger.error(`Error creating flight ${flightData.flightNumber}:`, error);
      }
    }

    logger.info(`✅ Database seeding completed successfully!`);
    logger.info(`📊 Summary:`);
    logger.info(`   - ${userCount} new users added`);
    logger.info(`   - ${flightCount} new flights added`);
    logger.info(`   - Total mock data entries: ${userCount + flightCount}`);

  } catch (error) {
    logger.error("❌ Error during database seeding:", error);
    process.exit(1);
  }
}

// Run seeding if this file is executed directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info("Seeding process completed");
      process.exit(0);
    })
    .catch((error) => {
      logger.error("Seeding process failed:", error);
      process.exit(1);
    });
}

export { seedDatabase };
