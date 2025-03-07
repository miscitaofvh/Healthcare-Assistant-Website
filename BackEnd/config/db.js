const mysql = require('mysql2/promise');
const { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } = require('./env');

const pool = mysql.createPool({
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;

(async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database Connected!');
    connection.release();
  } catch (error) {
    console.error('❌ MySQL Connection Error:', error.message);
  }
})();

async function registerUser(username, email, password) {
  try {
    const sql = 'INSERT INTO users (username, email, password) VALUES (?, ?, ?)';
    const [result] = await pool.query(sql, [username, email, password]);
    console.log('User registered with ID:', result.insertId);
  } catch (error) {
    console.error('Error inserting user:', error.message);
  }
}

