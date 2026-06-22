// routes/schedules.js - Schedule Management Routes
const express = require('express');
const pool = require('../config/database');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');
const { ensureSeatRows, syncAvailableSeats } = require('../utils/seatService');

const router = express.Router();

// Get cities that have routes
router.get('/cities', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [cities] = await connection.query(`
        SELECT city
        FROM (
          SELECT StartCity AS city FROM Routes WHERE IsActive = 1
          UNION
          SELECT EndCity AS city FROM Routes WHERE IsActive = 1
        ) availableCities
        ORDER BY city
      `);

      res.json((cities || []).map((row) => row.city));
    } finally {
      connection.release();
    }
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ message: 'Failed to fetch cities', error: error.message });
  }
});

// Search schedules
router.get('/search', [
  query('from').notEmpty().trim(),
  query('to').notEmpty().trim(),
  query('date').isISO8601()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { from, to, date } = req.query;
    const connection = await pool.getConnection();

    try {
      const [schedules] = await connection.query(`
        SELECT 
          s.ScheduleID, s.BusID, s.RouteID,
          b.BusNumber, b.BusType, b.Capacity,
          rt.StartCity, rt.EndCity, rt.Distance,
          s.DepartureTime, s.ArrivalTime,
          CASE
            WHEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID) > 0
            THEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID AND st.IsBooked = 0)
            ELSE s.AvailableSeats
          END as AvailableSeats,
          s.Fare, s.Status, s.TravelDate,
          CASE
            WHEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID) > 0
            THEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID AND st.IsBooked = 1)
            ELSE (b.Capacity - s.AvailableSeats)
          END as BookedSeats
        FROM Schedules s
        JOIN Buses b ON s.BusID = b.BusID
        JOIN Routes rt ON s.RouteID = rt.RouteID
        WHERE LOWER(rt.StartCity) = LOWER(?)
          AND LOWER(rt.EndCity) = LOWER(?)
          AND DATE(s.TravelDate) = ?
          AND s.Status = 'active'
          AND b.IsActive = 1
          AND rt.IsActive = 1
        ORDER BY s.DepartureTime ASC
      `, [from, to, date]);

      res.json(schedules || []);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// Get schedule details
router.get('/:scheduleId', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const connection = await pool.getConnection();

    try {
      const [schedules] = await connection.query(`
        SELECT 
          s.ScheduleID, s.BusID, s.RouteID,
          b.BusNumber, b.BusType, b.Capacity,
          rt.StartCity, rt.EndCity, rt.Distance,
          s.DepartureTime, s.ArrivalTime,
          CASE
            WHEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID) > 0
            THEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID AND st.IsBooked = 0)
            ELSE s.AvailableSeats
          END as AvailableSeats,
          s.Fare, s.Status, s.TravelDate,
          CASE
            WHEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID) > 0
            THEN (SELECT COUNT(*) FROM Seats st WHERE st.ScheduleID = s.ScheduleID AND st.IsBooked = 1)
            ELSE (b.Capacity - s.AvailableSeats)
          END as BookedSeats
        FROM Schedules s
        JOIN Buses b ON s.BusID = b.BusID
        JOIN Routes rt ON s.RouteID = rt.RouteID
        WHERE s.ScheduleID = ?
      `, [scheduleId]);

      if (schedules.length === 0) {
        return res.status(404).json({ message: 'Schedule not found' });
      }

      res.json(schedules[0]);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get schedule error:', error);
    res.status(500).json({ message: 'Failed to fetch schedule', error: error.message });
  }
});

// Get available seats for a schedule
router.get('/:scheduleId/seats', async (req, res) => {
  try {
    const { scheduleId } = req.params;
    const connection = await pool.getConnection();

    try {
      const seats = await ensureSeatRows(connection, scheduleId);
      await syncAvailableSeats(connection, scheduleId);

      res.json(seats || []);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get seats error:', error);
    res.status(500).json({ message: 'Failed to fetch seats', error: error.message });
  }
});

// Create schedule (Admin only)
router.post('/', authMiddleware, adminMiddleware, [
  body('busId').isInt(),
  body('routeId').isInt(),
  body('travelDate').isISO8601(),
  body('departureTime').notEmpty(),
  body('fare').isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busId, routeId, travelDate, departureTime, arrivalTime, fare } = req.body;
    const connection = await pool.getConnection();

    try {
      // Get bus capacity
      const [buses] = await connection.query('SELECT Capacity FROM Buses WHERE BusID = ?', [busId]);
      if (buses.length === 0) {
        return res.status(404).json({ message: 'Bus not found' });
      }

      const capacity = buses[0].Capacity;

      const [result] = await connection.query(
        'INSERT INTO Schedules (BusID, RouteID, TravelDate, DepartureTime, ArrivalTime, AvailableSeats, Fare, Status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [busId, routeId, travelDate, departureTime, arrivalTime, capacity, fare, 'active']
      );

      await ensureSeatRows(connection, result.insertId);

      res.status(201).json({
        message: 'Schedule created successfully',
        scheduleId: result.insertId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create schedule error:', error);
    res.status(500).json({ message: 'Failed to create schedule', error: error.message });
  }
});

module.exports = router;
