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

## 🔐 Authentication Endpoints

### 1. Google OAuth Initiation
```http
GET {{base_url}}/api/auth/google
```

**Response:**
```json
{
  "success": true,
  "data": {
    "oauth_url": "https://your-project.supabase.co/auth/v1/authorize?provider=google...",
    "provider": "google"
  }
}
```

### 2. OAuth Callback (Browser Only)
```http
GET {{base_url}}/api/auth/callback?code=AUTH_CODE&state=STATE
```

### 3. Send Phone OTP
```http
POST {{base_url}}/api/auth/phone/send-otp
Content-Type: application/json

{
  "phone": "+1234567890"
}
```

### 4. Verify Phone OTP
```http
POST {{base_url}}/api/auth/phone/verify-otp
Content-Type: application/json

{
  "phone": "+1234567890",
  "otp": "123456"
}
```

**Response (Save access_token):**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid-here",
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

### 5. Refresh Session
```http
POST {{base_url}}/api/auth/refresh
Content-Type: application/json

{
  "refresh_token": "{{refresh_token}}"
}
```

### 6. Sign Out
```http
POST {{base_url}}/api/auth/signout
Authorization: Bearer {{access_token}}
```

### 7. Get Auth Status
```http
GET {{base_url}}/api/auth/status
Authorization: Bearer {{access_token}}
```

### 8. Get User Profile (Protected)
```http
GET {{base_url}}/api/auth/profile
Authorization: Bearer {{access_token}}
```

## ✈️ Flight Booking Endpoints

### 1. Health Check
```http
GET {{base_url}}/api/health
```

### 2. Search Flights
```http
GET {{base_url}}/api/flights?origin=Bangalore&destination=Delhi&date=2025-09-22
```

**Query Parameters:**
- `origin`: Departure city (required)
- `destination`: Arrival city (required) 
- `date`: Date in YYYY-MM-DD format (required)

### 3. Get Flight Details
```http
GET {{base_url}}/api/flights/{{flight_id}}
```

### 4. Create Booking
```http
POST {{base_url}}/api/bookings
Content-Type: application/json

{
  "flightId": "{{flight_id}}",
  "userId": "{{user_id}}",
  "passengerName": "John Doe",
  "passengerAge": 30,
  "passportNumber": "A12345678",
  "totalPrice": "6100.00"
}
```

### 5. Get Booking Details
```http
GET {{base_url}}/api/bookings/{{booking_id}}
```

## 👤 User Management Endpoints (Protected)

### 1. Get User Profile
```http
GET {{base_url}}/api/users/{{user_id}}
Authorization: Bearer {{access_token}}
```

### 2. Get User Bookings
```http
GET {{base_url}}/api/users/{{user_id}}/bookings
Authorization: Bearer {{access_token}}
```

## 📋 API Documentation Endpoints

### 1. API Overview
```http
GET {{base_url}}/api
```

### 2. Root Endpoint
```http
GET {{base_url}}/
```

## 🧪 POSTMAN Collection Setup

### 1. Create New Collection
- Name: "Flight Booking API"
- Description: "Complete API testing for flight booking system with Supabase Auth"

### 2. Collection Authorization
- Type: **Bearer Token**
- Token: `{{access_token}}`
- This applies to all requests (can be overridden per request)

### 3. Pre-request Scripts (Collection Level)
```javascript
// Auto-refresh token if expired
if (pm.environment.get("token_expires_at")) {
    const expiresAt = parseInt(pm.environment.get("token_expires_at"));
    const now = Math.floor(Date.now() / 1000);
    
    if (now >= expiresAt - 300) { // Refresh 5 minutes before expiry
        // Trigger refresh token request
        console.log("Token expired, needs refresh");
    }
}
```

### 4. Tests Scripts (For Auth Endpoints)
```javascript
// Save tokens from auth responses
if (pm.response.json().success && pm.response.json().data.session) {
    const session = pm.response.json().data.session;
    
    pm.environment.set("access_token", session.access_token);
    pm.environment.set("refresh_token", session.refresh_token);
    pm.environment.set("token_expires_at", session.expires_at);
    
    console.log("✅ Access token saved to environment");
}

// Save user ID
if (pm.response.json().success && pm.response.json().data.user) {
    pm.environment.set("user_id", pm.response.json().data.user.id);
    console.log("✅ User ID saved to environment");
}
```

### 5. Tests Scripts (For Booking Creation)
```javascript
// Save booking ID from booking responses
if (pm.response.json().success && pm.response.json().data.booking_id) {
    pm.environment.set("booking_id", pm.response.json().data.booking_id);
    console.log("✅ Booking ID saved to environment");
}
```

## 🔄 Testing Flow Recommendations

### Flow 1: Phone OTP Authentication
1. `POST /api/auth/phone/send-otp`
2. `POST /api/auth/phone/verify-otp` (get access_token)
3. `GET /api/auth/profile` (test token)
4. `GET /api/flights?origin=Delhi&destination=Mumbai&date=2025-09-10`
5. `POST /api/bookings` (create booking)
6. `GET /api/users/{{user_id}}/bookings` (view user bookings)

### Flow 2: Google OAuth (Browser Required)
1. `GET /api/auth/google` (get oauth_url)
2. Open oauth_url in browser → Complete sign-in
3. Extract access_token from callback
4. Continue with protected endpoints

### Flow 3: Public API Testing
1. `GET /api/health`
2. `GET /api/flights` (search)
3. `GET /api/flights/{{flight_id}}` (details)
4. `POST /api/bookings` (create)
5. `GET /api/bookings/{{booking_id}}` (retrieve)

## ⚠️ Important Notes

### Authentication Status Codes:
- `200`: Success
- `400`: Bad request (invalid data)
- `401`: Unauthorized (missing/invalid token)
- `403`: Forbidden (insufficient permissions)
- `404`: Not found
- `500`: Server error

### Token Management:
- Access tokens expire (check `expires_at` field)
- Use refresh token to get new access token
- Include `Authorization: Bearer {token}` header for protected routes
- Tokens are tied to specific users (can't access other user's data)

### Phone OTP Requirements:
- Phone format: `+{country_code}{number}` (e.g., `+1234567890`)
- OTP is 6 digits
- Requires SMS provider configuration in Supabase

### Sample Valid Requests:
```bash
# Valid phone numbers for testing
+1234567890, +919876543210, +447123456789

# Valid date formats
2025-01-01, 2025-12-31, 2025-09-22

# Valid cities (case insensitive)
Delhi, Mumbai, Bangalore, Chennai, Hyderabad, Kolkata
```

This guide provides everything needed for comprehensive POSTMAN testing of your Flight Booking API with Supabase authentication!