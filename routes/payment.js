// routes/payment.js - Payment Confirmation
const express = require('express');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();

// Confirm payment (updates reservation status from pending to confirmed)
router.post('/confirm', authMiddleware, [
  body('booking_id').isInt(),
  body('method').notEmpty().trim(),
  body('details').isObject().optional()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { booking_id, method, details } = req.body;
    const { userId } = req.user;
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // Check if reservation exists, belongs to user, and is 'pending'
      const [reservations] = await connection.query(
        'SELECT * FROM Reservations WHERE ReservationID = ? AND PassengerID = ?',
        [booking_id, userId]
      );

      if (reservations.length === 0) {
        await connection.rollback();
        return res.status(404).json({ message: 'Reservation not found' });
      }

      const reservation = reservations[0];
      if (reservation.Status !== 'pending') {
        await connection.rollback();
        return res.status(400).json({ message: `Reservation cannot be confirmed. Current status: ${reservation.Status}` });
      }

      // Update status to confirmed
      await connection.query(
        'UPDATE Reservations SET Status = ? WHERE ReservationID = ?',
        ['confirmed', booking_id]
      );

      await connection.commit();
      res.json({ message: 'Payment confirmed successfully', booking_id });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Failed to confirm payment', error: error.message });
  }
});

module.exports = router;
