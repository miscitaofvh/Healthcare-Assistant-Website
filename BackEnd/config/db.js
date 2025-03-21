import dotenv from "dotenv";
import mysql from "mysql2/promise";

dotenv.config();

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

try {
  const connection = await pool.getConnection();
  console.log("✅ MySQL Database Connected!");
  connection.release();
} catch (error) {
  console.error("❌ MySQL Connection Error:", error.message);
}

export default pool; // Export mặc định để dùng import
