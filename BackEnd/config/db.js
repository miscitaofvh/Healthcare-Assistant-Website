import 'dotenv/config'; // Load environment variables from .env file

import mysql from 'mysql2';

// Access environment variables from process.env
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = process.env;

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export default pool.promise();

// Test the database connection
(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected!');
    connection.release(); // Release the connection back to the pool
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
})();