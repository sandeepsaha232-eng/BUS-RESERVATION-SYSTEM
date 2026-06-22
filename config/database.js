const mysql = require('mysql2/promise');
require('dotenv').config();

let pool;
let usingMySQL = false;

const initializeDatabase = async () => {
  // Try MySQL first
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'bus_reservation',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      enableKeepAlive: true,
      keepAliveInitialDelayMs: 0
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✓ MySQL database connected');
    conn.release();
    usingMySQL = true;
    return pool;
  } catch (err) {
    console.warn('✗ MySQL connection failed, switching to SQLite:', err.message);
    // Fall back to SQLite
    pool = require('./sqlite');
    return pool;
  }
};

// Initialize on module load
const dbPromise = initializeDatabase();

// Export a proxy that waits for initialization
module.exports = new Proxy({}, {
  get(target, prop) {
    if (prop === 'getConnection') {
      return async function() {
        const p = await dbPromise;
        return p.getConnection();
      };
    }
    return undefined;
  }
});
