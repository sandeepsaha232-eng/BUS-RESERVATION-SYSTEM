const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../bus_reservation.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('✗ SQLite connection failed:', err.message);
  } else {
    console.log('✓ SQLite database connected:', dbPath);
    initializeDatabase();
  }
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

const initializeDatabase = () => {
  db.serialize(() => {
    // Users Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Users (
        UserID INTEGER PRIMARY KEY AUTOINCREMENT,
        Name TEXT NOT NULL,
        Email TEXT UNIQUE NOT NULL,
        Password TEXT NOT NULL,
        Phone TEXT NOT NULL,
        Role TEXT DEFAULT 'passenger',
        Address TEXT,
        DateOfBirth DATE,
        IsActive INTEGER DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Buses Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Buses (
        BusID INTEGER PRIMARY KEY AUTOINCREMENT,
        BusNumber TEXT UNIQUE NOT NULL,
        Capacity INTEGER NOT NULL,
        BusType TEXT,
        Condition TEXT,
        OperatorName TEXT,
        IsActive INTEGER DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Routes Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Routes (
        RouteID INTEGER PRIMARY KEY AUTOINCREMENT,
        StartCity TEXT NOT NULL,
        EndCity TEXT NOT NULL,
        Distance INTEGER,
        EstimatedTime TEXT,
        Description TEXT,
        IsActive INTEGER DEFAULT 1,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Schedules Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Schedules (
        ScheduleID INTEGER PRIMARY KEY AUTOINCREMENT,
        BusID INTEGER NOT NULL,
        RouteID INTEGER NOT NULL,
        DepartureTime DATETIME NOT NULL,
        ArrivalTime DATETIME,
        AvailableSeats INTEGER NOT NULL,
        Fare DECIMAL(10, 2) NOT NULL,
        TravelDate DATE NOT NULL,
        Status TEXT DEFAULT 'active',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (BusID) REFERENCES Buses(BusID),
        FOREIGN KEY (RouteID) REFERENCES Routes(RouteID)
      )
    `);

    // Seats Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Seats (
        SeatID INTEGER PRIMARY KEY AUTOINCREMENT,
        ScheduleID INTEGER NOT NULL,
        SeatNumber INTEGER NOT NULL,
        IsBooked INTEGER DEFAULT 0,
        PassengerID INTEGER,
        BookingTime DATETIME,
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ScheduleID) REFERENCES Schedules(ScheduleID),
        FOREIGN KEY (PassengerID) REFERENCES Users(UserID),
        UNIQUE (ScheduleID, SeatNumber)
      )
    `);

    // Reservations Table
    db.run(`
      CREATE TABLE IF NOT EXISTS Reservations (
        ReservationID INTEGER PRIMARY KEY AUTOINCREMENT,
        ScheduleID INTEGER NOT NULL,
        PassengerID INTEGER NOT NULL,
        SeatNumber INTEGER NOT NULL,
        PassengerName TEXT,
        PassengerEmail TEXT,
        PassengerPhone TEXT,
        BookingDate DATETIME DEFAULT CURRENT_TIMESTAMP,
        Status TEXT DEFAULT 'confirmed',
        TotalFare DECIMAL(10, 2),
        PaymentStatus TEXT DEFAULT 'pending',
        CreatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        UpdatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (ScheduleID) REFERENCES Schedules(ScheduleID),
        FOREIGN KEY (PassengerID) REFERENCES Users(UserID)
      )
    `);
  });
};

// Create a promise-based wrapper that mimics mysql2/promise API
class SQLitePool {
  async getConnection() {
    return new SQLiteConnection(db);
  }
}

class SQLiteConnection {
  constructor(db) {
    this.db = db;
  }

  async query(sql, params = []) {
    const trimmed = sql.trim().toUpperCase();
    const isWrite = trimmed.startsWith('INSERT') || trimmed.startsWith('UPDATE') || trimmed.startsWith('DELETE');

    if (isWrite) {
      return new Promise((resolve, reject) => {
        this.db.run(sql, params, function(err) {
          if (err) reject(err);
          else {
            // Return in mysql2/promise format: [result, fields]
            resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
          }
        });
      });
    }

    return new Promise((resolve, reject) => {
      this.db.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else {
          // Return in mysql2/promise format: [rows, fields]
          resolve([rows || [], []]);
        }
      });
    });
  }

  async execute(sql, params = []) {
    return new Promise((resolve, reject) => {
      this.db.run(sql, params, function(err) {
        if (err) reject(err);
        else {
          // Return in mysql2/promise format: [result, fields]
          resolve([{ insertId: this.lastID, affectedRows: this.changes }, []]);
        }
      });
    });
  }

  async beginTransaction() {
    return new Promise((resolve, reject) => {
      this.db.run('BEGIN TRANSACTION', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async commit() {
    return new Promise((resolve, reject) => {
      this.db.run('COMMIT', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  async rollback() {
    return new Promise((resolve, reject) => {
      this.db.run('ROLLBACK', (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  release() {
    // No-op for SQLite as it doesn't need connection pooling
  }
}

module.exports = new SQLitePool();
