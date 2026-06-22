// routes/auth.js - Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
require('dotenv').config();

const router = express.Router();

// Register Route
router.post('/register', [
  body('name').notEmpty().trim(),
  body('email').isEmail(),
  body('password').isLength({ min: 6 }),
  body('phone').isMobilePhone(),
  body('address').notEmpty().trim()
], async (req, res) => {
  try {
    // Validate input
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, phone, address, dateOfBirth } = req.body;
    const connection = await pool.getConnection();

    try {
      // Check if user exists
      const [existingUser] = await connection.query(
        'SELECT * FROM Users WHERE Email = ?',
        [email]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Insert user
      const [result] = await connection.query(
        'INSERT INTO Users (Name, Email, Password, Phone, Role, Address, DateOfBirth) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [name, email, hashedPassword, phone, 'passenger', address, dateOfBirth || null]
      );

      // Generate JWT token
      const token = jwt.sign(
        { userId: result.insertId, email, role: 'passenger' },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        userId: result.insertId,
        role: 'passenger'
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ message: 'Registration failed', error: error.message });
  }
});

// Login Route
router.post('/login', [
  body('email').isEmail(),
  body('password').notEmpty()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    const connection = await pool.getConnection();

    try {
      const [users] = await connection.query(
        'SELECT * FROM Users WHERE Email = ?',
        [email]
      );

      if (users.length === 0) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const user = users[0];
      const passwordMatch = await bcrypt.compare(password, user.Password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      const token = jwt.sign(
        { userId: user.UserID, email: user.Email, role: user.Role },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
      );

      res.json({
        message: 'Login successful',
        token,
        userId: user.UserID,
        role: user.Role,
        name: user.Name
      });

    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Logout Route (client-side token removal)
router.post('/logout', (req, res) => {
  res.json({ message: 'Logged out successfully' });
});

// Refresh Token Route
router.post('/refresh-token', (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ message: 'Token required' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET, { ignoreExpiration: true });
    
    const newToken = jwt.sign(
      { userId: decoded.userId, email: decoded.email, role: decoded.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    res.json({ token: newToken });
  } catch (error) {
    res.status(401).json({ message: 'Invalid token', error: error.message });
  }
});

module.exports = router;
