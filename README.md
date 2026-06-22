# 🚌 Bus Reservation System

A full-stack web application for bus ticket reservation management built with **Node.js**, **Express.js**, **MySQL**, **HTML5**, **CSS3**, and **Vanilla JavaScript**. This system allows users to search for buses, view schedules, book seats, and manage their reservations with a clean, responsive UI.

---

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Project Structure](#-project-structure)
- [API Documentation](#-api-documentation)
- [Usage Examples](#-usage-examples)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### User Management
- ✅ **User Registration** with email validation
- ✅ **User Login** with JWT authentication
- ✅ **Role-Based Access Control** (Admin, Passenger, Conductor)
- ✅ **Secure Password Hashing** with bcryptjs
- ✅ **Token Refresh Mechanism** for extended sessions

### Bus Management
- ✅ **View Available Buses** with detailed specifications
- ✅ **Bus Information** including type, capacity, and operator
- ✅ **Admin CRUD Operations** for bus management
- ✅ **Bus Type Categorization** (AC Sleeper, Non-AC, etc.)

### Schedule Management
- ✅ **Search Buses** by route and travel date
- ✅ **Detailed Schedule Information** with timings and fares
- ✅ **Real-Time Seat Availability** tracking
- ✅ **Admin Schedule Creation** and management
- ✅ **Route-Based Filtering** for easy discovery

### Reservation System
- ✅ **Book Bus Seats** with instant confirmation
- ✅ **Interactive Seat Selection Map** with visual feedback
- ✅ **Real-Time Seat Availability** display
- ✅ **Cancel Reservations** with automatic seat release
- ✅ **View Booking History** and reservation details
- ✅ **Transaction Management** with database rollback support

### Additional Features
- ✅ **Responsive UI Design** (Mobile, Tablet, Desktop)
- ✅ **Error Handling & Notifications** for user feedback
- ✅ **Secure API Endpoints** with authentication
- ✅ **CORS Support** for development and production
- ✅ **Input Validation** on both client and server

---

## 🛠 Technology Stack

### Backend
- **Node.js** v14+ - JavaScript runtime environment
- **Express.js** - Fast and minimalist web framework
- **MySQL2/Promise** - Database driver with connection pooling
- **bcryptjs** - Secure password hashing
- **jsonwebtoken** - JWT authentication and authorization
- **express-validator** - Request validation middleware
- **dotenv** - Environment variable management
- **CORS** - Cross-Origin Resource Sharing support
- **body-parser** - Request body parsing

### Frontend
- **HTML5** - Semantic markup structure
- **CSS3** - Modern styling with animations and responsive design
- **Vanilla JavaScript** - Pure JavaScript (no frameworks)
- **Fetch API** - Asynchronous HTTP requests

### Database
- **MySQL** v5.7+ - Relational database management system
- **Indexes** - For query performance optimization
- **Foreign Keys** - For referential integrity

### Development Tools
- **nodemon** - Auto-reload server during development
- **npm** - Package manager

---

## 📥 Installation

### Prerequisites
- **Node.js** v14 or higher ([Download](https://nodejs.org/))
- **MySQL** v5.7 or higher ([Download](https://www.mysql.com/downloads/))
- **npm** or **yarn** (comes with Node.js)
- **Git** (optional, for version control)

### Step-by-Step Setup

#### 1. Navigate to Project Directory
```bash
cd bus-reservation-system
```

#### 2. Install Dependencies
```bash
npm install
```

#### 3. Create MySQL Database
```bash
# Method 1: Interactive
mysql -u root -p
CREATE DATABASE bus_reservation;
USE bus_reservation;
SOURCE database/schema.sql;
EXIT;

# Method 2: Command line
mysql -u root -p bus_reservation < database/schema.sql
```

#### 4. Configure Environment Variables
```bash
# Copy the example file
cp .env.example .env

# Edit with your credentials
nano .env
# or use your preferred editor (vim, code, etc.)
```

#### 5. Update .env File
```env
# Database Configuration
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=bus_reservation

# JWT Configuration
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d

# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
API_TIMEOUT=30000

# Email Configuration (optional)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password
```

---

## 🚀 Running the Application

### Development Mode (with auto-reload)
```bash
npm run dev
```
- Server runs on `http://localhost:5000`
- Automatically restarts when files change
- Shows detailed error messages

### Production Mode
```bash
npm start
```
- Optimized for production
- Single server instance
- Reduced logging

### Access Points
| URL | Description |
|-----|-------------|
| `http://localhost:5000` | Main application |
| `http://localhost:5000/api/health` | Health check endpoint |
| `http://localhost:5000/pages/login.html` | Login page |
| `http://localhost:5000/pages/register.html` | Registration page |
| `http://localhost:5000/pages/search.html` | Bus search page |

---

## 📁 Project Structure

```
bus-reservation-system/
│
├── config/
│   └── database.js                 # MySQL connection pool configuration
│
├── middleware/
│   └── auth.js                     # JWT verification & role-based access
│
├── routes/
│   ├── auth.js                     # Authentication endpoints (login, register)
│   ├── buses.js                    # Bus CRUD operations
│   ├── schedules.js                # Schedule search and management
│   └── reservations.js             # Booking and reservation management
│
├── database/
│   └── schema.sql                  # Complete database schema & sample data
│
├── public/
│   ├── index.html                  # Landing page with hero section
│   │
│   ├── css/
│   │   └── style.css               # Global styles & animations
│   │
│   ├── js/
│   │   ├── api.js                  # API client with all endpoints
│   │   ├── utils.js                # Helper & utility functions
│   │   ├── auth.js                 # Authentication logic
│   │   ├── booking.js              # Booking & reservation logic
│   │   └── app.js                  # Main app initialization
│   │
│   └── pages/
│       ├── login.html              # User login page
│       ├── register.html           # User registration page
│       ├── search.html             # Bus search and results page
│       └── booking.html            # Seat selection & booking page
│
├── server.js                       # Express server entry point
├── package.json                    # Project dependencies & scripts
├── .env                            # Environment variables (local, not in git)
├── .env.example                    # Environment template for developers
├── .gitignore                      # Git ignore rules
├── README.md                       # This documentation file
└── LICENSE                         # ISC License

```

---

## 🔌 API Documentation

### Authentication Endpoints

#### Register New User
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "9876543210",
  "address": "123 Main Street"
}

Response: 201 Created
{
  "message": "User registered successfully",
  "token": "eyJhbGc...",
  "userId": 1,
  "role": "passenger"
}
```

#### Login User
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "password123"
}

Response: 200 OK
{
  "message": "Login successful",
  "token": "eyJhbGc...",
  "userId": 1,
  "role": "passenger",
  "name": "John Doe"
}
```

#### Logout User
```http
POST /api/auth/logout
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Logged out successfully"
}
```

### Bus Endpoints

#### Get All Buses
```http
GET /api/buses

Response: 200 OK
[
  {
    "BusID": 1,
    "BusNumber": "BUS001",
    "Capacity": 50,
    "BusType": "AC Sleeper",
    "OperatorName": "Star Travels",
    "IsActive": 1
  },
  ...
]
```

#### Get Bus Details
```http
GET /api/buses/:busId

Response: 200 OK
{
  "BusID": 1,
  "BusNumber": "BUS001",
  "Capacity": 50,
  "BusType": "AC Sleeper",
  "OperatorName": "Star Travels"
}
```

#### Create Bus (Admin Only)
```http
POST /api/buses
Authorization: Bearer {admin_token}
Content-Type: application/json

{
  "busNumber": "BUS011",
  "capacity": 48,
  "busType": "AC Sleeper",
  "operatorName": "New Travels"
}

Response: 201 Created
{
  "message": "Bus created successfully",
  "busId": 11
}
```

### Schedule Endpoints

#### Search Schedules
```http
GET /api/schedules/search?from=Delhi&to=Bangalore&date=2024-12-25

Response: 200 OK
[
  {
    "ScheduleID": 1,
    "BusNumber": "BUS001",
    "BusType": "AC Sleeper",
    "StartCity": "Delhi",
    "EndCity": "Bangalore",
    "DepartureTime": "22:00:00",
    "ArrivalTime": "06:00:00",
    "AvailableSeats": 45,
    "Fare": 1500.00,
    "BookedSeats": 5,
    "Distance": 2150
  },
  ...
]
```

#### Get Schedule Details
```http
GET /api/schedules/:scheduleId

Response: 200 OK
{
  "ScheduleID": 1,
  "BusNumber": "BUS001",
  "Capacity": 50,
  "StartCity": "Delhi",
  "EndCity": "Bangalore",
  "DepartureTime": "2024-12-25 22:00:00",
  "ArrivalTime": "2024-12-26 06:00:00",
  "AvailableSeats": 45,
  "Fare": 1500.00
}
```

#### Get Available Seats
```http
GET /api/schedules/:scheduleId/seats

Response: 200 OK
[
  { "SeatNumber": 1, "IsBooked": false },
  { "SeatNumber": 2, "IsBooked": true },
  { "SeatNumber": 3, "IsBooked": false },
  ...
]
```

### Reservation Endpoints

#### Get User Reservations
```http
GET /api/reservations
Authorization: Bearer {token}

Response: 200 OK
[
  {
    "ReservationID": 1,
    "ScheduleID": 1,
    "BusNumber": "BUS001",
    "StartCity": "Delhi",
    "EndCity": "Bangalore",
    "SeatNumber": 10,
    "BookingDate": "2024-12-20 14:30:00",
    "Status": "confirmed",
    "TotalFare": 1500.00,
    "DepartureTime": "22:00:00",
    "ArrivalTime": "06:00:00"
  },
  ...
]
```

#### Get Reservation Details
```http
GET /api/reservations/:reservationId
Authorization: Bearer {token}

Response: 200 OK
{
  "ReservationID": 1,
  "ScheduleID": 1,
  "SeatNumber": 10,
  "BookingDate": "2024-12-20 14:30:00",
  "Status": "confirmed",
  "TotalFare": 1500.00,
  "BusNumber": "BUS001",
  "StartCity": "Delhi",
  "EndCity": "Bangalore",
  "DepartureTime": "22:00:00",
  "ArrivalTime": "06:00:00"
}
```

#### Create Reservation (Book Seat)
```http
POST /api/reservations
Authorization: Bearer {token}
Content-Type: application/json

{
  "scheduleId": 1,
  "seatNumber": 10,
  "passengerName": "John Doe",
  "passengerEmail": "john@example.com",
  "passengerPhone": "9876543210"
}

Response: 201 Created
{
  "message": "Reservation created successfully",
  "reservationId": 1,
  "totalFare": 1500.00
}
```

#### Cancel Reservation
```http
DELETE /api/reservations/:reservationId
Authorization: Bearer {token}

Response: 200 OK
{
  "message": "Reservation cancelled successfully"
}
```

---

## 📚 Database Schema

### Core Tables

| Table | Purpose | Key Fields |
|-------|---------|-----------|
| **Users** | User accounts | UserID, Email, Password (hashed), Role |
| **Buses** | Bus information | BusID, BusNumber, Capacity, BusType |
| **Routes** | Travel routes | RouteID, StartCity, EndCity, Distance |
| **Schedules** | Bus schedules | ScheduleID, BusID, RouteID, Fare, TravelDate |
| **Seats** | Seat occupancy | SeatID, ScheduleID, SeatNumber, IsBooked |
| **Reservations** | Bookings | ReservationID, ScheduleID, PassengerID, Status |
| **Conductors** | Conductor info | ConductorID, UserID, LicenseNumber |
| **Passengers** | Passenger profiles | PassengerID, UserID, IdProof |

### Database Design
- ✅ **Third Normal Form (3NF)** - Minimized redundancy
- ✅ **Foreign Keys** - Referential integrity
- ✅ **Indexes** - Query performance optimization
- ✅ **Timestamps** - CreatedAt, UpdatedAt tracking

---

## 🔐 Security Features

- ✅ **Password Security**: bcryptjs hashing with salt
- ✅ **JWT Authentication**: Secure token-based auth
- ✅ **SQL Injection Prevention**: Parameterized queries
- ✅ **CORS Protection**: Configurable origin restrictions
- ✅ **Input Validation**: Client and server-side validation
- ✅ **Role-Based Access**: Middleware-enforced permissions
- ✅ **Environment Variables**: Sensitive data never hardcoded
- ✅ **HTTPS Ready**: Deployment-ready for SSL/TLS

---

## 💡 Usage Examples

### Example 1: Complete Registration and Login Flow
```javascript
// Step 1: Register a new user
async function registerUser() {
  const response = await fetch('http://localhost:5000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: 'John Doe',
      email: 'john@example.com',
      password: 'SecurePass123!',
      phone: '9876543210',
      address: '123 Main Street, City'
    })
  });
  
  const data = await response.json();
  if (data.token) {
    localStorage.setItem('token', data.token);
    localStorage.setItem('userId', data.userId);
    console.log('✅ Registration successful!');
  }
}

// Step 2: Login
async function loginUser() {
  const response = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'john@example.com',
      password: 'SecurePass123!'
    })
  });
  
  const data = await response.json();
  localStorage.setItem('token', data.token);
  console.log('✅ Login successful!');
}
```

### Example 2: Search and Book
```javascript
// Step 1: Search buses
async function searchBuses() {
  const response = await fetch(
    'http://localhost:5000/api/schedules/search?from=Delhi&to=Bangalore&date=2024-12-25'
  );
  const buses = await response.json();
  console.log('Found buses:', buses);
  return buses[0]; // Return first result
}

// Step 2: View available seats
async function getSeats(scheduleId) {
  const response = await fetch(
    `http://localhost:5000/api/schedules/${scheduleId}/seats`
  );
  const seats = await response.json();
  console.log('Available seats:', seats.filter(s => !s.IsBooked));
}

// Step 3: Book a seat
async function bookSeat(scheduleId, seatNumber) {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/reservations', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      scheduleId: scheduleId,
      seatNumber: seatNumber,
      passengerName: 'John Doe',
      passengerEmail: 'john@example.com',
      passengerPhone: '9876543210'
    })
  });
  
  const data = await response.json();
  console.log('✅ Booking confirmed! ID:', data.reservationId);
  return data.reservationId;
}
```

### Example 3: View and Cancel Booking
```javascript
// View all reservations
async function viewMyBookings() {
  const token = localStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/reservations', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const reservations = await response.json();
  return reservations;
}

// Cancel a booking
async function cancelBooking(reservationId) {
  const token = localStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/reservations/${reservationId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  console.log('✅ Booking cancelled:', data.message);
}
```

---

## 🐛 Troubleshooting

### Database Connection Error
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solutions:**
- Start MySQL service: `brew services start mysql` (Mac) or `mysql.server start`
- Verify credentials in `.env` file
- Check if database `bus_reservation` exists: `mysql -u root -p -e "SHOW DATABASES;"`
- Ensure MySQL port 3306 is not blocked

### CORS Error
```
Access to fetch at 'http://localhost:5000/api/...' has been blocked by CORS policy
```
**Solutions:**
- Ensure `NODE_ENV=development` in `.env`
- Restart the server: `npm run dev`
- Check server console for error messages
- Verify CORS origins in `server.js`

### Port Already in Use
```
Error: listen EADDRINUSE: address already in use :::5000
```
**Solutions:**
```bash
# Option 1: Change port in .env
PORT=3001

# Option 2: Kill process on port 5000
lsof -i :5000
kill -9 <PID>

# Option 3: Use alternative node process
npm run dev -- --port 3001
```

### Module Not Found
```
Error: Cannot find module 'express'
```
**Solutions:**
```bash
# Reinstall all dependencies
rm -rf node_modules package-lock.json
npm install

# Or update npm
npm update
```

### JWT Token Expired
**Solutions:**
- User needs to login again
- Implement token refresh endpoint (already available)
- Increase `JWT_EXPIRE` duration in `.env`

### Database Table Doesn't Exist
```
Error: Table 'bus_reservation.Users' doesn't exist
```
**Solutions:**
```bash
# Re-run the schema script
mysql -u root -p bus_reservation < database/schema.sql

# Or verify tables exist
mysql -u root -p bus_reservation -e "SHOW TABLES;"
```

---

## 🚀 Deployment

### Preparing for Production

1. **Generate Secure JWT Secret**
```bash
openssl rand -base64 32
# Copy output to JWT_SECRET in .env
```

2. **Update Environment**
```env
NODE_ENV=production
DB_HOST=your_production_host
DB_USER=production_user
DB_PASSWORD=strong_password
JWT_SECRET=your_secure_secret
PORT=5000
```

3. **Install Dependencies**
```bash
npm install --production
```

4. **Create Database** on production server
```bash
mysql -u root -p < database/schema.sql
```

### Deployment Platforms

| Platform | Benefits | Setup |
|----------|----------|-------|
| **Heroku** | Easy deployment, auto-scaling | `git push heroku main` |
| **AWS EC2** | Full control, scalable | Setup Node.js + MySQL |
| **DigitalOcean** | Affordable, simple | Create Droplet + App Platform |
| **Azure** | Enterprise features | App Service + MySQL |
| **Railway** | Modern, easy GitHub integration | Connect GitHub repo |

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json .
RUN npm install
COPY . .
EXPOSE 5000
CMD ["npm", "start"]
```

---

## 📖 Learning Resources

### Documentation
- [Node.js Official Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [MySQL Documentation](https://dev.mysql.com/doc/)
- [JWT Best Practices](https://jwt.io/)
- [REST API Design](https://restfulapi.net/)

### Related Topics
- [bcryptjs Documentation](https://www.npmjs.com/package/bcryptjs)
- [express-validator](https://express-validator.github.io/docs/)
- [CORS Explained](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Setup
```bash
# Clone the repository
git clone <repository-url>
cd bus-reservation-system

# Create a feature branch
git checkout -b feature/YourFeatureName

# Make your changes
# Test thoroughly

# Commit with clear messages
git commit -m "feat: Add YourFeatureName"

# Push to your fork
git push origin feature/YourFeatureName

# Create a Pull Request
```

### Commit Message Format
```
feat: Add new feature
fix: Fix bug
docs: Update documentation
style: Code style changes
refactor: Code refactoring
test: Add tests
chore: Maintenance
```

### Code Standards
- Follow existing code style
- Add comments for complex logic
- Test all new features
- Update README if needed
- Keep commits focused and atomic

### Reporting Issues
Include:
- Detailed description
- Steps to reproduce
- Expected vs actual behavior
- Screenshots (if applicable)
- System information (OS, Node version, etc.)

---

## 📄 License

This project is licensed under the **ISC License** - see below for details:

```
ISC License (ISC)

Permission to use, copy, modify, and/or distribute this software for any
purpose with or without fee is hereby granted, provided that the above
copyright notice and this permission notice appear in all copies.

THE SOFTWARE IS PROVIDED "AS IS" AND THE AUTHOR DISCLAIMS ALL WARRANTIES
WITH REGARD TO THIS SOFTWARE INCLUDING ALL IMPLIED WARRANTIES OF
MERCHANTABILITY AND FITNESS. IN NO EVENT SHALL THE AUTHOR BE LIABLE FOR
ANY SPECIAL, DIRECT, INDIRECT, OR CONSEQUENTIAL DAMAGES OR ANY DAMAGES
WHATSOEVER RESULTING FROM LOSS OF USE, DATA OR PROFITS, WHETHER IN AN
ACTION OF CONTRACT, NEGLIGENCE OR OTHER TORTIOUS ACTION, ARISING OUT OF
OR IN CONNECTION WITH THE USE OR PERFORMANCE OF THIS SOFTWARE.
```

---

## 👥 Support & Contact

- **Issues**: Create an issue on GitHub
- **Discussions**: Use GitHub Discussions for questions
- **Email**: contact@example.com

---

## ✅ Quick Checklist for Getting Started

- [ ] Clone/navigate to project directory
- [ ] Run `npm install`
- [ ] Copy `.env.example` to `.env`
- [ ] Update `.env` with your database credentials
- [ ] Create MySQL database and run schema
- [ ] Start server with `npm run dev`
- [ ] Open `http://localhost:5000` in browser
- [ ] Register a new account
- [ ] Search for buses
- [ ] Book a seat
- [ ] Enjoy the application! 🎉

---

## 🎯 Future Enhancements

- [ ] Email notifications for bookings
- [ ] Payment gateway integration
- [ ] Real-time updates with WebSockets
- [ ] Admin dashboard
- [ ] Multi-language support
- [ ] Mobile app (React Native)
- [ ] Rating and reviews system
- [ ] Conductor app
- [ ] SMS notifications
- [ ] Refund policy automation

---

**Built with ❤️ using Node.js, Express, and MySQL**

*Last Updated: 2026-06-22*
