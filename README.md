# ✈️ Flight Booking API

A comprehensive Node.js/Express backend for a flight booking system with in-memory storage, featuring flight search, booking management, and user operations.

## 🚀 Features

- **Flight Search**: Search flights by origin, destination, and date
- **Booking Management**: Create and retrieve flight bookings
- **User Profiles**: User management and booking history
- **Data Validation**: Comprehensive request validation using Zod
- **Error Handling**: Detailed error messages and logging
- **CORS Support**: Ready for frontend integration
- **Mock Data**: Pre-loaded sample data for testing

## 📋 API Endpoints

### Flights
- `GET /api/flights` - Search flights with query parameters
- `GET /api/flights/:id` - Get flight details by ID

### Bookings  
- `POST /api/bookings` - Create new booking
- `GET /api/bookings/:id` - Get booking details by ID

### Users
- `GET /api/users/:id` - Get user profile
- `GET /api/users/:id/bookings` - Get user booking history

### Health & Info
- `GET /api/health` - Health check
- `GET /api` - API documentation

## 🛠️ Technology Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Database**: In-memory storage (MemStorage)
- **Validation**: Zod schemas
- **Language**: TypeScript
- **Build Tool**: Vite

## 🔧 Installation & Setup

### Prerequisites
- Node.js 18 or higher
- npm or yarn package manager

### Quick Start

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd flight-booking-api
   npm install
   ```

2. **Environment Configuration**
   Create a `.env` file in the root directory:
   ```env
   PORT=5000
   NODE_ENV=development
   FRONTEND_URL=http://localhost:3000
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```
   
   Server will be running on `http://localhost:5000`

4. **Seed Sample Data** (Optional)
   ```bash
   npm run seed
   ```

## 📊 Database Schema

### Users Table
- `id` (UUID, Primary Key)
- `full_name` (VARCHAR)
- `email` (VARCHAR, Unique) 
- `password_hash` (VARCHAR)
- `created_at` (TIMESTAMP)

### Flights Table  
- `id` (UUID, Primary Key)
- `flight_number` (VARCHAR)
- `airline_name` (VARCHAR)
- `departure_city` (VARCHAR)
- `arrival_city` (VARCHAR)
- `departure_time` (TIMESTAMP)
- `arrival_time` (TIMESTAMP)
- `duration_minutes` (INTEGER)
- `price` (DECIMAL)
- `seats_available` (INTEGER)
- `created_at` (TIMESTAMP)

### Bookings Table
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key)
- `flight_id` (UUID, Foreign Key) 
- `booking_reference` (VARCHAR, Unique)
- `passenger_name` (VARCHAR)
- `passenger_age` (INTEGER)
- `passport_number` (VARCHAR)
- `seat_number` (VARCHAR)
- `total_price` (DECIMAL)
- `status` (VARCHAR)
- `created_at` (TIMESTAMP)

## 🧪 Testing

### API Testing with cURL

**Search Flights:**
```bash
curl "http://localhost:5000/api/flights?origin=Delhi&destination=Mumbai&date=2025-09-10"
