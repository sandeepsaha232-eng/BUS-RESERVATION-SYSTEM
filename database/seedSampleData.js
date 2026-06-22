const bcrypt = require('bcryptjs');
const { ensureSeatRows, syncAvailableSeats } = require('../utils/seatService');

const cities = [
  { name: 'Bangalore', lat: 12.9716, lon: 77.5946 },
  { name: 'Hyderabad', lat: 17.3850, lon: 78.4867 },
  { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  { name: 'Mumbai', lat: 19.0760, lon: 72.8777 },
  { name: 'Pune', lat: 18.5204, lon: 73.8567 },
  { name: 'Delhi', lat: 28.7041, lon: 77.1025 },
  { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  { name: 'Ahmedabad', lat: 23.0225, lon: 72.5714 },
  { name: 'Jaipur', lat: 26.9124, lon: 75.7873 },
  { name: 'Cochin', lat: 9.9312, lon: 76.2673 },
  { name: 'Goa', lat: 15.2993, lon: 74.1240 },
  { name: 'Lucknow', lat: 26.8467, lon: 80.9462 },
  { name: 'Indore', lat: 22.7196, lon: 75.8577 },
  { name: 'Bhopal', lat: 23.2599, lon: 77.4126 },
  { name: 'Patna', lat: 25.5941, lon: 85.1376 },
  { name: 'Nagpur', lat: 21.1458, lon: 79.0882 },
  { name: 'Surat', lat: 21.1702, lon: 72.8311 },
  { name: 'Vadodara', lat: 22.3072, lon: 73.1812 },
  { name: 'Visakhapatnam', lat: 17.6868, lon: 83.2185 },
  { name: 'Mysore', lat: 12.2958, lon: 76.6394 }
];

const busTypes = ['AC Sleeper', 'AC Seater', 'Non-AC Sleeper', 'Volvo AC', 'Luxury Sleeper'];
const operators = [
  'Star Travels',
  'Royal Tours',
  'Golden Route',
  'Express Coach',
  'National Travels',
  'City Connect',
  'Premium Routes',
  'Comfort Journey'
];
const capacities = [36, 40, 44, 45, 48, 50, 52];
const departureSlots = ['06:00', '09:30', '13:00', '17:30', '21:00'];
const popularPairs = new Set([
  'Bangalore->Hyderabad',
  'Hyderabad->Bangalore',
  'Bangalore->Chennai',
  'Chennai->Bangalore',
  'Mumbai->Pune',
  'Pune->Mumbai',
  'Delhi->Jaipur',
  'Jaipur->Delhi',
  'Mumbai->Goa',
  'Goa->Mumbai',
  'Chennai->Hyderabad',
  'Hyderabad->Chennai'
]);

let seedPromise = null;

function pad(value) {
  return String(value).padStart(2, '0');
}

function toDateValue(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function toDateTimeValue(date) {
  return `${toDateValue(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60 * 1000);
}

function dateFromValueAndTime(dateValue, timeValue) {
  const [year, month, day] = dateValue.split('-').map(Number);
  const [hour, minute] = timeValue.split(':').map(Number);
  return new Date(year, month - 1, day, hour, minute, 0);
}

function nextTravelDates(days = 3) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: days }, (_, index) => {
    const date = new Date(today);
    date.setDate(today.getDate() + index);
    return toDateValue(date);
  });
}

function distanceBetween(start, end) {
  const earthRadiusKm = 6371;
  const toRadians = (degrees) => degrees * Math.PI / 180;
  const dLat = toRadians(end.lat - start.lat);
  const dLon = toRadians(end.lon - start.lon);
  const lat1 = toRadians(start.lat);
  const lat2 = toRadians(end.lat);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  const directDistance = 2 * earthRadiusKm * Math.asin(Math.sqrt(a));

  return Math.max(90, Math.round(directDistance * 1.25));
}

function travelMinutesForDistance(distance) {
  return Math.max(120, Math.round((distance / 58) * 60));
}

function estimatedTimeForDistance(distance) {
  const minutes = travelMinutesForDistance(distance);
  const hoursPart = Math.floor(minutes / 60);
  const minutesPart = minutes % 60;
  return `${pad(hoursPart)}:${pad(minutesPart)}:00`;
}

function fareFor(distance, busType, slotIndex) {
  const typeMultiplier = busType.includes('Luxury') || busType.includes('Volvo')
    ? 2.35
    : busType.includes('AC')
      ? 1.9
      : 1.45;
  return Math.round(((distance * typeMultiplier) + 120 + (slotIndex * 35)) / 50) * 50;
}

function routeKey(startCity, endCity) {
  return `${startCity}->${endCity}`;
}

async function execute(connection, sql, params = []) {
  if (typeof connection.execute === 'function') {
    return connection.execute(sql, params);
  }

  return connection.query(sql, params);
}

async function columnExists(connection, tableName, columnName) {
  try {
    await connection.query(`SELECT ${columnName} FROM ${tableName} LIMIT 1`);
    return true;
  } catch (error) {
    return false;
  }
}

async function ensureColumn(connection, tableName, columnName, definition) {
  const exists = await columnExists(connection, tableName, columnName);
  if (exists) return;

  try {
    await execute(connection, `ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
  } catch (error) {
    if (!/duplicate column|already exists/i.test(error.message)) {
      throw error;
    }
  }
}

async function runMigrations(connection) {
  await ensureColumn(connection, 'Reservations', 'TotalFare', 'DECIMAL(10, 2)');
  await ensureColumn(connection, 'Reservations', 'PassengerName', 'TEXT');
  await ensureColumn(connection, 'Reservations', 'PassengerEmail', 'TEXT');
  await ensureColumn(connection, 'Reservations', 'PassengerPhone', 'TEXT');

  const hasTotalPrice = await columnExists(connection, 'Reservations', 'TotalPrice');
  if (hasTotalPrice) {
    await connection.query(`
      UPDATE Reservations
      SET TotalFare = TotalPrice
      WHERE TotalFare IS NULL AND TotalPrice IS NOT NULL
    `);
  }
}

async function getOrCreateBus(connection, bus) {
  const [existing] = await connection.query(
    'SELECT BusID, Capacity FROM Buses WHERE BusNumber = ?',
    [bus.busNumber]
  );

  if (existing.length > 0) {
    return {
      id: existing[0].BusID,
      busNumber: bus.busNumber,
      capacity: Number(existing[0].Capacity)
    };
  }

  const [result] = await connection.query(`
    INSERT INTO Buses (BusNumber, Capacity, BusType, OperatorName, IsActive)
    VALUES (?, ?, ?, ?, 1)
  `, [bus.busNumber, bus.capacity, bus.busType, bus.operatorName]);

  return {
    id: result.insertId,
    busNumber: bus.busNumber,
    capacity: bus.capacity
  };
}

async function seedBuses(connection) {
  const buses = [];

  for (let index = 0; index < 80; index += 1) {
    buses.push(await getOrCreateBus(connection, {
      busNumber: `BR${pad(index + 1).padStart(3, '0')}`,
      capacity: capacities[index % capacities.length],
      busType: busTypes[index % busTypes.length],
      operatorName: operators[index % operators.length]
    }));
  }

  return buses;
}

async function getOrCreateRoute(connection, start, end) {
  const [existing] = await connection.query(
    'SELECT RouteID, Distance FROM Routes WHERE StartCity = ? AND EndCity = ?',
    [start.name, end.name]
  );

  if (existing.length > 0) {
    return {
      id: existing[0].RouteID,
      start: start.name,
      end: end.name,
      distance: Number(existing[0].Distance)
    };
  }

  const distance = distanceBetween(start, end);
  const [result] = await connection.query(`
    INSERT INTO Routes (StartCity, EndCity, Distance, EstimatedTime, Description, IsActive)
    VALUES (?, ?, ?, ?, ?, 1)
  `, [
    start.name,
    end.name,
    distance,
    estimatedTimeForDistance(distance),
    `${start.name} to ${end.name} express route`
  ]);

  return {
    id: result.insertId,
    start: start.name,
    end: end.name,
    distance
  };
}

async function seedRoutes(connection) {
  const routes = [];

  for (const start of cities) {
    for (const end of cities) {
      if (start.name === end.name) continue;
      routes.push(await getOrCreateRoute(connection, start, end));
    }
  }

  return routes;
}

async function getExistingSchedule(connection, routeId, travelDate, departureTime) {
  const [existing] = await connection.query(`
    SELECT s.ScheduleID, b.Capacity
    FROM Schedules s
    JOIN Buses b ON s.BusID = b.BusID
    WHERE s.RouteID = ? AND DATE(s.TravelDate) = ? AND s.DepartureTime = ?
    LIMIT 1
  `, [routeId, travelDate, departureTime]);

  return existing[0] || null;
}

async function seedSchedules(connection, routes, buses) {
  const dates = nextTravelDates();
  const scheduleIds = [];

  for (let routeIndex = 0; routeIndex < routes.length; routeIndex += 1) {
    const route = routes[routeIndex];
    const routeIsPopular = popularPairs.has(routeKey(route.start, route.end));

    for (let dayIndex = 0; dayIndex < dates.length; dayIndex += 1) {
      const slotCount = routeIsPopular ? 2 : 1;

      for (let slotOffset = 0; slotOffset < slotCount; slotOffset += 1) {
        const slotIndex = (routeIndex + dayIndex + slotOffset * 2) % departureSlots.length;
        const travelDate = dates[dayIndex];
        const departure = dateFromValueAndTime(travelDate, departureSlots[slotIndex]);
        const departureTime = toDateTimeValue(departure);
        const existing = await getExistingSchedule(connection, route.id, travelDate, departureTime);

        if (existing) {
          scheduleIds.push(existing.ScheduleID);
          continue;
        }

        const bus = buses[(routeIndex + dayIndex + slotOffset) % buses.length];
        const arrival = addMinutes(departure, travelMinutesForDistance(route.distance));
        const busType = busTypes[(routeIndex + slotIndex) % busTypes.length];
        const fare = fareFor(route.distance, busType, slotIndex);

        const [result] = await connection.query(`
          INSERT INTO Schedules (
            BusID, RouteID, DepartureTime, ArrivalTime,
            AvailableSeats, Fare, TravelDate, Status
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, 'active')
        `, [
          bus.id,
          route.id,
          departureTime,
          toDateTimeValue(arrival),
          bus.capacity,
          fare,
          travelDate
        ]);

        scheduleIds.push(result.insertId);
      }
    }
  }

  return scheduleIds;
}

function sampleUsers() {
  const names = [
    'Aarav Sharma', 'Ananya Rao', 'Vihaan Patel', 'Isha Nair', 'Kabir Singh',
    'Meera Iyer', 'Arjun Reddy', 'Kavya Menon', 'Rohan Das', 'Priya Kapoor',
    'Aditya Jain', 'Sneha Verma', 'Nikhil Gupta', 'Divya Shah', 'Varun Mehta',
    'Riya Sen', 'Rahul Khanna', 'Pooja Bhat', 'Karan Malhotra', 'Neha Saxena',
    'Amit Tiwari', 'Lakshmi Rao', 'Siddharth Roy', 'Shreya Desai', 'Harish Kumar',
    'Nisha Agarwal', 'Manish Joshi', 'Zara Khan', 'Deepak Yadav', 'Simran Kaur'
  ];

  return names.map((name, index) => ({
    name,
    email: `sample.passenger${pad(index + 1)}@example.com`,
    phone: `90000${String(index + 1).padStart(5, '0')}`,
    address: `${index + 11} Sample Street`
  }));
}

async function getOrCreateUser(connection, user, passwordHash) {
  const [existing] = await connection.query(
    'SELECT UserID, Name, Email, Phone FROM Users WHERE Email = ?',
    [user.email]
  );

  if (existing.length > 0) return existing[0];

  const [result] = await connection.query(`
    INSERT INTO Users (Name, Email, Password, Phone, Role, Address, DateOfBirth)
    VALUES (?, ?, ?, ?, 'passenger', ?, ?)
  `, [user.name, user.email, passwordHash, user.phone, user.address, '1995-01-01']);

  return {
    UserID: result.insertId,
    Name: user.name,
    Email: user.email,
    Phone: user.phone
  };
}

async function seedUsers(connection) {
  const passwordHash = await bcrypt.hash('password123', 10);
  const users = [];

  for (const user of sampleUsers()) {
    users.push(await getOrCreateUser(connection, user, passwordHash));
  }

  return users;
}

async function activeReservationExists(connection, scheduleId, seatNumber) {
  const [existing] = await connection.query(`
    SELECT ReservationID
    FROM Reservations
    WHERE ScheduleID = ? AND SeatNumber = ? AND Status != 'cancelled'
    LIMIT 1
  `, [scheduleId, seatNumber]);

  return existing.length > 0;
}

async function seedSampleReservations(connection, users) {
  const [schedules] = await connection.query(`
    SELECT s.ScheduleID, s.Fare, b.Capacity
    FROM Schedules s
    JOIN Buses b ON s.BusID = b.BusID
    WHERE s.Status = 'active'
    ORDER BY s.TravelDate ASC, s.ScheduleID ASC
    LIMIT 700
  `);

  const touchedSchedules = new Set();

  for (const schedule of schedules) {
    const capacity = Number(schedule.Capacity);
    const requestedCount = Number(schedule.ScheduleID) % 4;
    if (requestedCount === 0) continue;

    await ensureSeatRows(connection, schedule.ScheduleID);

    const candidateSeats = [2, 7, 11, 18, 23, 31]
      .filter((seatNumber) => seatNumber <= capacity)
      .slice(0, requestedCount);

    for (let index = 0; index < candidateSeats.length; index += 1) {
      const seatNumber = candidateSeats[index];
      if (await activeReservationExists(connection, schedule.ScheduleID, seatNumber)) {
        continue;
      }

      const user = users[(Number(schedule.ScheduleID) + index) % users.length];
      const [seatUpdate] = await connection.query(`
        UPDATE Seats
        SET IsBooked = 1, PassengerID = ?, BookingTime = CURRENT_TIMESTAMP
        WHERE ScheduleID = ? AND SeatNumber = ? AND IsBooked = 0
      `, [user.UserID, schedule.ScheduleID, seatNumber]);

      if (seatUpdate.affectedRows === 0) continue;

      await connection.query(`
        INSERT INTO Reservations (
          ScheduleID, PassengerID, SeatNumber,
          PassengerName, PassengerEmail, PassengerPhone,
          BookingDate, Status, TotalFare
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, 'confirmed', ?)
      `, [
        schedule.ScheduleID,
        user.UserID,
        seatNumber,
        user.Name,
        user.Email,
        user.Phone,
        schedule.Fare
      ]);

      touchedSchedules.add(schedule.ScheduleID);
    }
  }

  for (const scheduleId of touchedSchedules) {
    await syncAvailableSeats(connection, scheduleId);
  }
}

async function countRows(connection, tableName) {
  const [rows] = await connection.query(`SELECT COUNT(*) AS count FROM ${tableName}`);
  return rows[0] ? Number(rows[0].count) : 0;
}

async function seedSampleDataOnce(pool) {
  const connection = await pool.getConnection();

  try {
    await runMigrations(connection);
    const buses = await seedBuses(connection);
    const routes = await seedRoutes(connection);
    await seedSchedules(connection, routes, buses);
    const users = await seedUsers(connection);
    await seedSampleReservations(connection, users);

    const routeCount = await countRows(connection, 'Routes');
    const scheduleCount = await countRows(connection, 'Schedules');
    const seatCount = await countRows(connection, 'Seats');
    console.log(`✓ Sample data ready: ${routeCount} routes, ${scheduleCount} schedules, ${seatCount} seats`);
  } finally {
    connection.release();
  }
}

function seedSampleData(pool) {
  if (!seedPromise) {
    seedPromise = seedSampleDataOnce(pool).catch((error) => {
      seedPromise = null;
      throw error;
    });
  }

  return seedPromise;
}

module.exports = seedSampleData;
