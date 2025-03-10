const dotenv = require('dotenv');
const mysql = require('mysql2/promise');

// Load environment variables
dotenv.config({ path: './.env' });

// Access environment variables
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

// Create a connection pool
const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected!');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
})();

module.exports = pool;
