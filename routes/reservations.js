// routes/reservations.js - Reservation Management Routes
const express = require('express');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get user's reservations
router.get('/', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      const [reservations] = await connection.query(`
        SELECT 
          r.ReservationID, r.ScheduleID, r.SeatNumber,
          r.BookingDate, r.Status, r.TotalFare,
          b.BusNumber, rt.StartCity, rt.EndCity,
          s.DepartureTime, s.ArrivalTime, s.Fare
        FROM Reservations r
        JOIN Schedules s ON r.ScheduleID = s.ScheduleID
        JOIN Buses b ON s.BusID = b.BusID
        JOIN Routes rt ON s.RouteID = rt.RouteID
        WHERE r.PassengerID = ?
        ORDER BY r.BookingDate DESC
      `, [userId]);

      res.json(reservations || []);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get reservations error:', error);
    res.status(500).json({ message: 'Failed to fetch reservations', error: error.message });
  }
});

// Get reservation details
router.get('/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      const [reservations] = await connection.query(`
        SELECT 
          r.ReservationID, r.ScheduleID, r.SeatNumber,
          r.BookingDate, r.Status, r.TotalFare,
          b.BusNumber, rt.StartCity, rt.EndCity,
          s.DepartureTime, s.ArrivalTime, s.Fare
        FROM Reservations r
        JOIN Schedules s ON r.ScheduleID = s.ScheduleID
        JOIN Buses b ON s.BusID = b.BusID
        JOIN Routes rt ON s.RouteID = rt.RouteID
        WHERE r.ReservationID = ? AND r.PassengerID = ?
      `, [reservationId, userId]);

      if (reservations.length === 0) {
        return res.status(404).json({ message: 'Reservation not found' });
      }

      res.json(reservations[0]);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get reservation error:', error);
    res.status(500).json({ message: 'Failed to fetch reservation', error: error.message });
  }
});

// Create reservation (Book a seat)
router.post('/', authMiddleware, [
  body('scheduleId').isInt(),
  body('seatNumber').isInt(),
  body('passengerName').notEmpty().trim(),
  body('passengerEmail').isEmail()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { scheduleId, seatNumber, passengerName, passengerEmail } = req.body;
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check seat availability
      const [seatCheck] = await connection.query(
        'SELECT * FROM Seats WHERE ScheduleID = ? AND SeatNumber = ? AND IsBooked = 0',
        [scheduleId, seatNumber]
      );

      if (seatCheck.length === 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Seat not available' });
      }

      // Get schedule and fare information
      const [schedules] = await connection.query(
        'SELECT Fare FROM Schedules WHERE ScheduleID = ?',
        [scheduleId]
      );

      if (schedules.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Schedule not found' });
      }

      const fare = schedules[0].Fare;

      // Create reservation
      const [reservationResult] = await connection.query(
        'INSERT INTO Reservations (ScheduleID, PassengerID, SeatNumber, BookingDate, Status, TotalFare) VALUES (?, ?, ?, NOW(), ?, ?)',
        [scheduleId, userId, seatNumber, 'confirmed', fare]
      );

      // Update seat status
      await connection.query(
        'UPDATE Seats SET IsBooked = 1, PassengerID = ?, BookingTime = NOW() WHERE ScheduleID = ? AND SeatNumber = ?',
        [userId, scheduleId, seatNumber]
      );

      // Update available seats
      await connection.query(
        'UPDATE Schedules SET AvailableSeats = AvailableSeats - 1 WHERE ScheduleID = ?',
        [scheduleId]
      );

      await connection.commit();

      res.status(201).json({
        message: 'Reservation created successfully',
        reservationId: reservationResult.insertId,
        totalFare: fare
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create reservation error:', error);
    res.status(500).json({ message: 'Failed to create reservation', error: error.message });
  }
});

// Cancel reservation
router.delete('/:reservationId', authMiddleware, async (req, res) => {
  try {
    const { reservationId } = req.params;
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      const [reservation] = await connection.query(
        'SELECT * FROM Reservations WHERE ReservationID = ? AND PassengerID = ?',
        [reservationId, userId]
      );

      if (reservation.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Reservation not found' });
      }

      // Update reservation status
      await connection.query(
        'UPDATE Reservations SET Status = ? WHERE ReservationID = ?',
        ['cancelled', reservationId]
      );

      // Free up seat
      const res_data = reservation[0];
      await connection.query(
        'UPDATE Seats SET IsBooked = 0, PassengerID = NULL WHERE ScheduleID = ? AND SeatNumber = ?',
        [res_data.ScheduleID, res_data.SeatNumber]
      );

      // Update available seats
      await connection.query(
        'UPDATE Schedules SET AvailableSeats = AvailableSeats + 1 WHERE ScheduleID = ?',
        [res_data.ScheduleID]
      );

      await connection.commit();
      res.json({ message: 'Reservation cancelled successfully' });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Cancel reservation error:', error);
    res.status(500).json({ message: 'Failed to cancel reservation', error: error.message });
  }
});

module.exports = router;
