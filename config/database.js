const mysql = require('mysql2/promise');
const seedSampleData = require('../database/seedSampleData');
require('dotenv').config();

let pool;
let usingMySQL = false;

const initializeDatabase = async () => {
  // Try MySQL first
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
      ssl: {
        rejectUnauthorized: false
      }
    });

    // Test connection
    const conn = await pool.getConnection();
    console.log('✓ MySQL database connected');
    conn.release();
    usingMySQL = true;
    try {
      await seedSampleData(pool);
    } catch (seedError) {
      console.warn('✗ Sample data seed skipped:', seedError.message);
    }
    return pool;
  } catch (err) {
    console.warn('✗ MySQL connection failed, switching to SQLite:', err.message);
    // Fall back to SQLite
    pool = require('./sqlite');
    try {
      await seedSampleData(pool);
    } catch (seedError) {
      console.warn('✗ Sample data seed skipped:', seedError.message);
    }
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
