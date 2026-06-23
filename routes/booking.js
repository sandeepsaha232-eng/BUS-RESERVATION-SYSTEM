// routes/booking.js - Booking Initiation
const express = require('express');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');
const { ensureSeatRows, syncAvailableSeats } = require('../utils/seatService');

const router = express.Router();

// Initiate booking (creates a pending reservation)
router.post('/initiate', authMiddleware, [
  body('scheduleId').isInt(),
  body('seatNumber').isInt(),
  body('passengerName').notEmpty().trim(),
  body('passengerEmail').isEmail(),
  body('passengerPhone').optional({ checkFalsy: true }).trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { scheduleId, seatNumber, passengerName, passengerEmail, passengerPhone } = req.body;
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Get schedule and fare information
      const [schedules] = await connection.query(
        `SELECT s.Fare, b.Capacity
         FROM Schedules s
         JOIN Buses b ON s.BusID = b.BusID
         WHERE s.ScheduleID = ? AND s.Status = 'active'`,
        [scheduleId]
      );

      if (schedules.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Schedule not found or inactive' });
      }

      const fare = schedules[0].Fare;
      const capacity = Number(schedules[0].Capacity);

      if (Number(seatNumber) < 1 || Number(seatNumber) > capacity) {
        await connection.rollback();
        return res.status(400).json({ message: 'Invalid seat number' });
      }

      await ensureSeatRows(connection, scheduleId);

      const [seatCheck] = await connection.query(
        'SELECT IsBooked FROM Seats WHERE ScheduleID = ? AND SeatNumber = ?',
        [scheduleId, seatNumber]
      );

      if (seatCheck.length === 0 || Number(seatCheck[0].IsBooked) === 1) {
        await connection.rollback();
        return res.status(400).json({ message: 'Seat not available' });
      }

      const [seatUpdate] = await connection.query(`
        UPDATE Seats
        SET IsBooked = 1, PassengerID = ?, BookingTime = CURRENT_TIMESTAMP
        WHERE ScheduleID = ? AND SeatNumber = ? AND IsBooked = 0
      `, [userId, scheduleId, seatNumber]);

      if (seatUpdate.affectedRows === 0) {
        await connection.rollback();
        return res.status(400).json({ message: 'Seat not available' });
      }

      // Create reservation with status 'pending'
      const [reservationResult] = await connection.query(
        `INSERT INTO Reservations (
          ScheduleID, PassengerID, SeatNumber,
          PassengerName, PassengerEmail, PassengerPhone,
          BookingDate, Status, TotalFare
        )
        VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?, ?)`,
        [scheduleId, userId, seatNumber, passengerName, passengerEmail, passengerPhone || null, 'pending', fare]
      );

      await syncAvailableSeats(connection, scheduleId);

      await connection.commit();

      res.status(201).json({
        booking_id: reservationResult.insertId
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Initiate booking error:', error);
    res.status(500).json({ message: 'Failed to initiate booking', error: error.message });
  }
});

module.exports = router;
