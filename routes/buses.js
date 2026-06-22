// routes/buses.js - Bus Management Routes
const express = require('express');
const pool = require('../config/database');
const { body, validationResult } = require('express-validator');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get all buses
router.get('/', async (req, res) => {
  try {
    const connection = await pool.getConnection();

    try {
      const [buses] = await connection.query('SELECT * FROM Buses WHERE IsActive = 1');
      res.json(buses || []);
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get buses error:', error);
    res.status(500).json({ message: 'Failed to fetch buses', error: error.message });
  }
});

// Get bus details
router.get('/:busId', async (req, res) => {
  try {
    const { busId } = req.params;
    const connection = await pool.getConnection();

    try {
      const [buses] = await connection.query(
        'SELECT * FROM Buses WHERE BusID = ? AND IsActive = 1',
        [busId]
      );

      if (buses.length === 0) {
        return res.status(404).json({ message: 'Bus not found' });
      }

      res.json(buses[0]);

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Get bus error:', error);
    res.status(500).json({ message: 'Failed to fetch bus', error: error.message });
  }
});

// Create bus (Admin only)
router.post('/', authMiddleware, adminMiddleware, [
  body('busNumber').notEmpty().trim(),
  body('capacity').isInt({ min: 1 }),
  body('busType').notEmpty().trim(),
  body('operatorName').notEmpty().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { busNumber, capacity, busType, operatorName } = req.body;
    const connection = await pool.getConnection();

    try {
      const [result] = await connection.query(
        'INSERT INTO Buses (BusNumber, Capacity, BusType, OperatorName, IsActive) VALUES (?, ?, ?, ?, ?)',
        [busNumber, capacity, busType, operatorName, 1]
      );

      res.status(201).json({
        message: 'Bus created successfully',
        busId: result.insertId
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Create bus error:', error);
    res.status(500).json({ message: 'Failed to create bus', error: error.message });
  }
});

// Update bus (Admin only)
router.put('/:busId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { busId } = req.params;
    const { busNumber, capacity, busType, operatorName } = req.body;
    const connection = await pool.getConnection();

    try {
      await connection.query(
        'UPDATE Buses SET BusNumber = ?, Capacity = ?, BusType = ?, OperatorName = ? WHERE BusID = ?',
        [busNumber, capacity, busType, operatorName, busId]
      );

      res.json({ message: 'Bus updated successfully' });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Update bus error:', error);
    res.status(500).json({ message: 'Failed to update bus', error: error.message });
  }
});

// Delete bus (Admin only)
router.delete('/:busId', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { busId } = req.params;
    const connection = await pool.getConnection();

    try {
      await connection.query(
        'UPDATE Buses SET IsActive = 0 WHERE BusID = ?',
        [busId]
      );

      res.json({ message: 'Bus deleted successfully' });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Delete bus error:', error);
    res.status(500).json({ message: 'Failed to delete bus', error: error.message });
  }
});

module.exports = router;
