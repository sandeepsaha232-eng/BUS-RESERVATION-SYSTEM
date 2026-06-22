// server.js - Main Entry Point
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const pool = require('./config/database');

const app = express();

// Middleware
const corsOptions = process.env.NODE_ENV === 'development' 
  ? { origin: '*', credentials: false }
  : {
      origin: ['http://localhost:3000', 'http://localhost:5000', 'http://localhost:5500', 'http://127.0.0.1:5000', 'http://127.0.0.1:5500'],
      credentials: true
    };

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/buses', require('./routes/buses'));
app.use('/api/schedules', require('./routes/schedules'));
app.use('/api/reservations', require('./routes/reservations'));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'Server is running', timestamp: new Date() });
});

// Serve main index.html for root path
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(500).json({ 
    message: 'Server error', 
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✓ Server running on http://localhost:${PORT}`);
  console.log(`✓ Environment: ${process.env.NODE_ENV}`);
});

module.exports = app;
