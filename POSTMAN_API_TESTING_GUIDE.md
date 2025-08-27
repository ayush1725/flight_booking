# ✈️ Flight Booking API - POSTMAN Testing Guide

## 🔧 Environment Variables Setup

### Create these variables in POSTMAN Environment:

```json
{
  "base_url": "http://localhost:5000",
  "access_token": "",
  "refresh_token": "",
  "user_id": "",
  "flight_id": "",
  "booking_id": ""
}
```

## 👥 Sample Test Data

### Test Users (Available in Database):
```json
{
  "alice_id": "0608189f-5d31-4f3b-bf56-4f5cbef08ce5",
  "alice_email": "alice.johnson@example.com",
  
  "bob_id": "300d2f7f-e0d5-4039-8b0f-087a1155e6dc", 
  "bob_email": "bob.williams@example.com",
  
  "carol_id": "243ac1c2-4c0d-4c27-a285-ddb0d61f36f4",
  "carol_email": "carol.davis@example.com"
}
```

### Sample Flight IDs:
```json
{
  "vistara_blr_del": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
  "spicejet_che_hyd": "f401ff68-d692-47e5-b827-557766551111",
  "indigo_mum_kochi": "air_india_del_goa_id",
  "go_first_ahm_mum": "go_first_flight_id"
}
```

## 📁 POSTMAN Collection Structure

```
Flight Booking API/
├── 📁 Authentication/
│   ├── Google OAuth Initiation (GET)
│   ├── OAuth Callback (GET)
│   ├── Send Phone OTP (POST)
│   ├── Verify Phone OTP (POST)
│   ├── Refresh Session (POST)
│   ├── Get Auth Status (GET)
│   ├── Get User Profile (GET) [Protected]
│   └── Sign Out (POST) [Protected]
├── 📁 Flights/
│   ├── Health Check (GET)
│   ├── Search Flights (GET)
│   └── Get Flight Details (GET)
├── 📁 Bookings/
│   ├── Create Booking (POST)
│   └── Get Booking Details (GET)
├── 📁 Users/ [Protected]
│   ├── Get User Profile (GET)
│   └── Get User Bookings (GET)
└── 📁 Documentation/
    ├── API Overview (GET)
    └── Root Endpoint (GET)
```

---

# 📁 AUTHENTICATION ENDPOINTS

## 1. Google OAuth Initiation
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/google`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "oauth_url": "https://xxxxx.supabase.co/auth/v1/authorize?provider=google&redirect_to=http://localhost:5000/api/auth/callback",
    "provider": "google"
  }
}
```

**Response (500):**
```json
{
  "success": false,
  "error": "Failed to generate OAuth URL"
}
```

---

## 2. OAuth Callback (Browser Only)
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/callback`  
**Headers:** None  
**Body:** None  
**Query Params:** Handled by OAuth provider  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "12345678-1234-1234-1234-123456789012",
      "email": "user@gmail.com",
      "phone": null
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "refresh-token-here",
      "expires_at": 1640995200,
      "token_type": "bearer"
    }
  }
}
```

---

## 3. Send Phone OTP
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/phone/send-otp`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+1234567890"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "OTP sent successfully",
    "phone": "+1234567890"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid phone number format"
}
```

**Response (500):**
```json
{
  "success": false,
  "error": "Unsupported phone provider configured"
}
```

---

## 4. Verify Phone OTP
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/phone/verify-otp`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "87654321-4321-4321-4321-210987654321",
      "email": null,
      "phone": "+1234567890"
    },
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "refresh-token-here",
      "expires_at": 1640995200,
      "token_type": "bearer"
    }
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid OTP"
}
```

---

## 5. Refresh Session
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/refresh`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "refresh_token": "{{refresh_token}}"
}
```

**Response (200):**
```json
{
  "success": true,
  "data": {
    "session": {
      "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refresh_token": "new-refresh-token-here",
      "expires_at": 1640995200,
      "token_type": "bearer"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Invalid refresh token"
}
```

---

## 6. Get Auth Status
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/status`  
**Headers:**
```
Authorization: Bearer {{access_token}} (optional)
```
**Body:** None  

**Response (200) - With Token:**
```json
{
  "success": true,
  "data": {
    "authenticated": true,
    "user": {
      "id": "12345678-1234-1234-1234-123456789012",
      "email": "user@gmail.com",
      "phone": "+1234567890"
    }
  }
}
```

**Response (200) - Without Token:**
```json
{
  "success": true,
  "data": {
    "authenticated": false,
    "user": null
  }
}
```

---

## 7. Get User Profile (Protected)
**Method:** `GET`  
**URL:** `{{base_url}}/api/auth/profile`  
**Headers:**
```
Authorization: Bearer {{access_token}}
```
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "12345678-1234-1234-1234-123456789012",
      "email": "user@gmail.com",
      "phone": "+1234567890",
      "created_at": "2025-01-01T12:00:00.000Z"
    }
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized - Missing or invalid token"
}
```

---

## 8. Sign Out (Protected)
**Method:** `POST`  
**URL:** `{{base_url}}/api/auth/signout`  
**Headers:**
```
Authorization: Bearer {{access_token}}
```
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Successfully signed out"
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

# 📁 FLIGHTS ENDPOINTS

## 1. Health Check
**Method:** `GET`  
**URL:** `{{base_url}}/api/health`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "status": "OK",
    "message": "Flight Booking API is running",
    "timestamp": "2025-08-27T12:00:00.000Z",
    "version": "1.0.0"
  }
}
```

---

## 2. Search Flights
**Method:** `GET`  
**URL:** `{{base_url}}/api/flights?origin=Bangalore&destination=Delhi&date=2025-09-22`  
**Headers:** None  
**Body:** None  
**Query Parameters:**
- `origin` (required): Departure city
- `destination` (required): Arrival city  
- `date` (required): Date in YYYY-MM-DD format

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "id": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
      "flightNumber": "UK786",
      "airline": "Vistara",
      "origin": "Bangalore",
      "destination": "Delhi",
      "departureTime": "08:30",
      "arrivalTime": "11:30",
      "date": "2025-09-22",
      "price": "6100.00",
      "availableSeats": 45,
      "aircraft": "Airbus A320"
    },
    {
      "id": "f401ff68-d692-47e5-b827-557766551111",
      "flightNumber": "SG402",
      "airline": "SpiceJet",
      "origin": "Bangalore",
      "destination": "Delhi",
      "departureTime": "14:15",
      "arrivalTime": "17:00",
      "date": "2025-09-22",
      "price": "4500.00",
      "availableSeats": 32,
      "aircraft": "Boeing 737"
    }
  ]
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "No flights found for the specified route and date"
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Missing required parameters: origin, destination, date"
}
```

---

## 3. Get Flight Details
**Method:** `GET`  
**URL:** `{{base_url}}/api/flights/{{flight_id}}`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
    "flightNumber": "UK786",
    "airline": "Vistara",
    "origin": "Bangalore",
    "destination": "Delhi",
    "departureTime": "08:30",
    "arrivalTime": "11:30",
    "date": "2025-09-22",
    "price": "6100.00",
    "availableSeats": 45,
    "aircraft": "Airbus A320",
    "duration": "3h 00m",
    "stops": 0,
    "facilities": ["WiFi", "Meal", "Entertainment"]
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Flight not found"
}
```

---

# 📁 BOOKINGS ENDPOINTS

## 1. Create Booking
**Method:** `POST`  
**URL:** `{{base_url}}/api/bookings`  
**Headers:**
```
Content-Type: application/json
```

**Request Body:**
```json
{
  "flightId": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
  "userId": "0608189f-5d31-4f3b-bf56-4f5cbef08ce5",
  "passengerName": "John Doe",
  "passengerAge": 30,
  "passportNumber": "A12345678",
  "totalPrice": "6100.00"
}
```

**Response (201):**
```json
{
  "success": true,
  "data": {
    "booking_id": "booking-12345-abcde-67890",
    "flightId": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
    "userId": "0608189f-5d31-4f3b-bf56-4f5cbef08ce5",
    "passengerName": "John Doe",
    "passengerAge": 30,
    "passportNumber": "A12345678",
    "totalPrice": "6100.00",
    "bookingStatus": "confirmed",
    "pnr": "ABC123",
    "bookingDate": "2025-08-27T12:00:00.000Z"
  }
}
```

**Response (400):**
```json
{
  "success": false,
  "error": "Invalid flight ID or user ID"
}
```

**Response (409):**
```json
{
  "success": false,
  "error": "Flight is fully booked"
}
```

---

## 2. Get Booking Details
**Method:** `GET`  
**URL:** `{{base_url}}/api/bookings/{{booking_id}}`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "booking_id": "booking-12345-abcde-67890",
    "flight": {
      "id": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
      "flightNumber": "UK786",
      "airline": "Vistara",
      "origin": "Bangalore",
      "destination": "Delhi",
      "departureTime": "08:30",
      "arrivalTime": "11:30",
      "date": "2025-09-22"
    },
    "passenger": {
      "name": "John Doe",
      "age": 30,
      "passportNumber": "A12345678"
    },
    "totalPrice": "6100.00",
    "bookingStatus": "confirmed",
    "pnr": "ABC123",
    "bookingDate": "2025-08-27T12:00:00.000Z"
  }
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "Booking not found"
}
```

---

# 📁 USERS ENDPOINTS (Protected)

## 1. Get User Profile
**Method:** `GET`  
**URL:** `{{base_url}}/api/users/{{user_id}}`  
**Headers:**
```
Authorization: Bearer {{access_token}}
```
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "id": "0608189f-5d31-4f3b-bf56-4f5cbef08ce5",
    "name": "Alice Johnson",
    "email": "alice.johnson@example.com",
    "phone": "+1234567890",
    "dateOfBirth": "1992-03-15",
    "nationality": "Indian",
    "passportNumber": "A12345678",
    "createdAt": "2025-01-01T12:00:00.000Z",
    "totalBookings": 3
  }
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized - Missing or invalid token"
}
```

**Response (403):**
```json
{
  "success": false,
  "error": "Forbidden - Cannot access other user's profile"
}
```

**Response (404):**
```json
{
  "success": false,
  "error": "User not found"
}
```

---

## 2. Get User Bookings
**Method:** `GET`  
**URL:** `{{base_url}}/api/users/{{user_id}}/bookings`  
**Headers:**
```
Authorization: Bearer {{access_token}}
```
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": [
    {
      "booking_id": "booking-12345-abcde-67890",
      "flight": {
        "id": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
        "flightNumber": "UK786",
        "airline": "Vistara",
        "origin": "Bangalore",
        "destination": "Delhi",
        "date": "2025-09-22",
        "departureTime": "08:30",
        "arrivalTime": "11:30"
      },
      "passenger": {
        "name": "John Doe",
        "age": 30
      },
      "totalPrice": "6100.00",
      "bookingStatus": "confirmed",
      "pnr": "ABC123",
      "bookingDate": "2025-08-27T12:00:00.000Z"
    }
  ]
}
```

**Response (401):**
```json
{
  "success": false,
  "error": "Unauthorized - Missing or invalid token"
}
```

**Response (403):**
```json
{
  "success": false,
  "error": "Forbidden - Cannot access other user's bookings"
}
```

---

# 📁 DOCUMENTATION ENDPOINTS

## 1. API Overview
**Method:** `GET`  
**URL:** `{{base_url}}/api`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "name": "Flight Booking API",
    "version": "1.0.0",
    "description": "Complete flight booking system with authentication",
    "endpoints": {
      "authentication": "/api/auth",
      "flights": "/api/flights",
      "bookings": "/api/bookings",
      "users": "/api/users"
    }
  }
}
```

---

## 2. Root Endpoint
**Method:** `GET`  
**URL:** `{{base_url}}/`  
**Headers:** None  
**Body:** None  

**Response (200):**
```json
{
  "success": true,
  "data": {
    "message": "Welcome to Flight Booking API",
    "version": "1.0.0",
    "docs": "/api",
    "health": "/api/health"
  }
}
```

---

# 🧪 POSTMAN Collection Setup

## 1. Create Collection with Folders
Create a new collection called **"Flight Booking API"** with these folders:
- **📁 Authentication** (8 requests)
- **📁 Flights** (3 requests)  
- **📁 Bookings** (2 requests)
- **📁 Users** (2 requests) 
- **📁 Documentation** (2 requests)

## 2. Collection Authorization
- **Type:** Bearer Token
- **Token:** `{{access_token}}`
- **Add to:** Header
- **Header Prefix:** Bearer

## 3. Collection Variables
Right-click Collection → Edit → Variables:
```json
{
  "base_url": "http://localhost:5000",
  "access_token": "",
  "refresh_token": "",
  "user_id": "",
  "flight_id": "84cc35d1-5d15-4f41-8423-9bfde5aecdd7",
  "booking_id": ""
}
```

## 4. Collection Pre-request Script
```javascript
// Auto-refresh token if expired
const expiresAt = pm.environment.get("token_expires_at");
if (expiresAt) {
    const now = Math.floor(Date.now() / 1000);
    if (now >= (parseInt(expiresAt) - 300)) {
        console.log("⚠️ Token expires soon - consider refreshing");
    }
}

console.log("🚀 Request to:", pm.request.url.toString());
```

## 5. Auth Endpoint Tests Script
Add this to **Authentication folder requests**:
```javascript
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has success field", function () {
    pm.expect(pm.response.json()).to.have.property('success');
});

// Save tokens from auth responses
if (pm.response.json().success && pm.response.json().data.session) {
    const session = pm.response.json().data.session;
    
    pm.environment.set("access_token", session.access_token);
    pm.environment.set("refresh_token", session.refresh_token);
    pm.environment.set("token_expires_at", session.expires_at);
    
    console.log("✅ Tokens saved to environment");
}

// Save user ID
if (pm.response.json().success && pm.response.json().data.user) {
    pm.environment.set("user_id", pm.response.json().data.user.id);
    console.log("✅ User ID saved:", pm.response.json().data.user.id);
}
```

## 6. Booking Tests Script
Add this to **Create Booking request**:
```javascript
pm.test("Status code is 201", function () {
    pm.response.to.have.status(201);
});

// Save booking ID
if (pm.response.json().success && pm.response.json().data.booking_id) {
    pm.environment.set("booking_id", pm.response.json().data.booking_id);
    console.log("✅ Booking ID saved:", pm.response.json().data.booking_id);
}
```

---

# 🔄 Testing Workflows

## Workflow 1: Complete Phone Authentication Flow
1. **📁 Authentication** → Send Phone OTP
2. **📁 Authentication** → Verify Phone OTP (saves token)
3. **📁 Authentication** → Get Auth Status
4. **📁 Authentication** → Get User Profile
5. **📁 Flights** → Search Flights
6. **📁 Bookings** → Create Booking
7. **📁 Users** → Get User Bookings

## Workflow 2: Google OAuth Flow
1. **📁 Authentication** → Google OAuth Initiation (copy oauth_url)
2. Open oauth_url in browser → Complete sign-in
3. Extract access_token from callback URL
4. Manually set access_token in environment
5. Continue with protected endpoints

## Workflow 3: Public API Testing
1. **📁 Documentation** → Root Endpoint
2. **📁 Documentation** → API Overview  
3. **📁 Flights** → Health Check
4. **📁 Flights** → Search Flights
5. **📁 Flights** → Get Flight Details
6. **📁 Bookings** → Create Booking
7. **📁 Bookings** → Get Booking Details

---

# ⚠️ Status Codes Reference

| Code | Meaning | Common Causes |
|------|---------|---------------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 400 | Bad Request | Invalid request body/parameters |
| 401 | Unauthorized | Missing/invalid access token |
| 403 | Forbidden | Valid token but insufficient permissions |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Resource conflict (e.g., fully booked) |
| 500 | Server Error | Internal server/database error |

---

# 📝 Notes & Tips

### Token Management:
- Access tokens expire in 1 hour
- Use refresh token to get new access token
- Protected routes require `Authorization: Bearer {token}` header
- Users can only access their own data

### Phone OTP Testing:
- Use format: `+{country_code}{number}`
- Example: `+1234567890`, `+919876543210`
- Requires Supabase SMS provider configuration
- OTP is 6 digits (use any 6 digits for testing if configured)

### Flight Search:
- Valid cities: Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata
- Date format: YYYY-MM-DD (e.g., 2025-09-22)
- All parameters (origin, destination, date) are required

### Common Variables to Set:
```bash
base_url = http://localhost:5000 (development)
flight_id = 84cc35d1-5d15-4f41-8423-9bfde5aecdd7
user_id = 0608189f-5d31-4f3b-bf56-4f5cbef08ce5
```

This comprehensive guide provides detailed request/response examples for every endpoint in your Flight Booking API! 🚀