// routes/schedules.js - Schedule Management Routes
const express = require('express');
const pool = require('../config/database');
const { body, validationResult, query } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

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
          s.AvailableSeats, s.Fare, s.Status, s.TravelDate,
          (b.Capacity - s.AvailableSeats) as BookedSeats
        FROM Schedules s
        JOIN Buses b ON s.BusID = b.BusID
        JOIN Routes rt ON s.RouteID = rt.RouteID
        WHERE rt.StartCity = ? AND rt.EndCity = ? AND DATE(s.TravelDate) = ? AND s.Status = 'active'
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
          s.AvailableSeats, s.Fare, s.Status, s.TravelDate,
          (b.Capacity - s.AvailableSeats) as BookedSeats
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
      const [seats] = await connection.query(
        'SELECT SeatNumber, IsBooked FROM Seats WHERE ScheduleID = ? ORDER BY SeatNumber',
        [scheduleId]
      );

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
