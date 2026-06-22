-- Bus Reservation System - Database Schema
-- MySQL Database Schema

-- Create Database
CREATE DATABASE IF NOT EXISTS bus_reservation;
USE bus_reservation;

-- Users Table
CREATE TABLE IF NOT EXISTS Users (
  UserID INT AUTO_INCREMENT PRIMARY KEY,
  Name VARCHAR(100) NOT NULL,
  Email VARCHAR(100) UNIQUE NOT NULL,
  Password VARCHAR(255) NOT NULL,
  Phone VARCHAR(20) NOT NULL,
  Role ENUM('admin', 'passenger', 'conductor') DEFAULT 'passenger',
  Address VARCHAR(255),
  DateOfBirth DATE,
  IsActive BOOLEAN DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (Email),
  INDEX idx_role (Role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Buses Table
CREATE TABLE IF NOT EXISTS Buses (
  BusID INT AUTO_INCREMENT PRIMARY KEY,
  BusNumber VARCHAR(50) UNIQUE NOT NULL,
  Capacity INT NOT NULL CHECK (Capacity > 0),
  BusType VARCHAR(50),
  Condition VARCHAR(50),
  OperatorName VARCHAR(100),
  IsActive BOOLEAN DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_busNumber (BusNumber),
  INDEX idx_isActive (IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Routes Table
CREATE TABLE IF NOT EXISTS Routes (
  RouteID INT AUTO_INCREMENT PRIMARY KEY,
  StartCity VARCHAR(100) NOT NULL,
  EndCity VARCHAR(100) NOT NULL,
  Distance INT,
  EstimatedTime TIME,
  Description VARCHAR(255),
  IsActive BOOLEAN DEFAULT 1,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_cities (StartCity, EndCity),
  INDEX idx_isActive (IsActive)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Schedules Table
CREATE TABLE IF NOT EXISTS Schedules (
  ScheduleID INT AUTO_INCREMENT PRIMARY KEY,
  BusID INT NOT NULL,
  RouteID INT NOT NULL,
  DepartureTime DATETIME NOT NULL,
  ArrivalTime DATETIME,
  AvailableSeats INT NOT NULL,
  Fare DECIMAL(10, 2) NOT NULL,
  TravelDate DATE NOT NULL,
  Status ENUM('active', 'cancelled', 'completed') DEFAULT 'active',
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (BusID) REFERENCES Buses(BusID),
  FOREIGN KEY (RouteID) REFERENCES Routes(RouteID),
  INDEX idx_busId (BusID),
  INDEX idx_routeId (RouteID),
  INDEX idx_travelDate (TravelDate),
  INDEX idx_status (Status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seats Table (Track seat occupancy)
CREATE TABLE IF NOT EXISTS Seats (
  SeatID INT AUTO_INCREMENT PRIMARY KEY,
  ScheduleID INT NOT NULL,
  SeatNumber INT NOT NULL,
  IsBooked BOOLEAN DEFAULT 0,
  PassengerID INT,
  BookingTime TIMESTAMP NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ScheduleID) REFERENCES Schedules(ScheduleID),
  FOREIGN KEY (PassengerID) REFERENCES Users(UserID),
  UNIQUE KEY unique_seat (ScheduleID, SeatNumber),
  INDEX idx_scheduleId (ScheduleID),
  INDEX idx_isBooked (IsBooked)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Reservations Table
CREATE TABLE IF NOT EXISTS Reservations (
  ReservationID INT AUTO_INCREMENT PRIMARY KEY,
  ScheduleID INT NOT NULL,
  PassengerID INT NOT NULL,
  SeatNumber INT NOT NULL,
  BookingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Status ENUM('pending', 'confirmed', 'cancelled', 'completed') DEFAULT 'confirmed',
  TotalFare DECIMAL(10, 2) NOT NULL,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (ScheduleID) REFERENCES Schedules(ScheduleID),
  FOREIGN KEY (PassengerID) REFERENCES Users(UserID),
  INDEX idx_scheduleId (ScheduleID),
  INDEX idx_passengerId (PassengerID),
  INDEX idx_status (Status),
  INDEX idx_bookingDate (BookingDate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Conductors Table
CREATE TABLE IF NOT EXISTS Conductors (
  ConductorID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  LicenseNumber VARCHAR(50) UNIQUE NOT NULL,
  Experience INT,
  AssignedBusID INT,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES Users(UserID),
  FOREIGN KEY (AssignedBusID) REFERENCES Buses(BusID),
  INDEX idx_userId (UserID),
  INDEX idx_assignedBusId (AssignedBusID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Passengers Table
CREATE TABLE IF NOT EXISTS Passengers (
  PassengerID INT AUTO_INCREMENT PRIMARY KEY,
  UserID INT NOT NULL UNIQUE,
  IdProof VARCHAR(50),
  IdProofNumber VARCHAR(100) UNIQUE,
  CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UpdatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (UserID) REFERENCES Users(UserID),
  INDEX idx_userId (UserID)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert Sample Routes
INSERT INTO Routes (StartCity, EndCity, Distance, EstimatedTime) VALUES
('Delhi', 'Bangalore', 2150, '32:00:00'),
('Mumbai', 'Pune', 150, '03:30:00'),
('Chennai', 'Bangalore', 350, '05:30:00'),
('Kolkata', 'Delhi', 1500, '20:00:00'),
('Hyderabad', 'Bangalore', 570, '08:00:00'),
('Delhi', 'Agra', 230, '03:30:00'),
('Mumbai', 'Goa', 780, '12:00:00'),
('Jaipur', 'Delhi', 240, '04:00:00'),
('Indore', 'Bhopal', 190, '03:00:00'),
('Lucknow', 'Delhi', 450, '06:30:00');

-- Insert Sample Buses
INSERT INTO Buses (BusNumber, Capacity, BusType, OperatorName) VALUES
('BUS001', 50, 'AC Sleeper', 'Star Travels'),
('BUS002', 45, 'Non-AC Sleeper', 'Royal Tours'),
('BUS003', 50, 'AC Sleeper', 'Golden Route'),
('BUS004', 40, 'AC Seater', 'Express Coach'),
('BUS005', 55, 'AC Sleeper', 'National Travels'),
('BUS006', 45, 'AC Sleeper', 'City Tours'),
('BUS007', 50, 'Non-AC Sleeper', 'Budget Travel'),
('BUS008', 48, 'AC Sleeper', 'Premium Routes'),
('BUS009', 42, 'AC Seater', 'Quick Transit'),
('BUS010', 50, 'AC Sleeper', 'Comfort Journey');

-- Insert Sample Admin User
INSERT INTO Users (Name, Email, Password, Phone, Role, Address) VALUES
('Admin User', 'admin@busreservation.com', '$2a$10$YourHashedPasswordHere', '9876543210', 'admin', 'Admin Office');
