import pool from "../config/db.js";

const User = {
  async create(username, email, password) {
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, password]
    );
    return result.insertId;
  },

  async findByEmail(email) {
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    return rows[0];
  },

  async findById(id) {
    const [rows] = await pool.query("SELECT * FROM users WHERE id = ?", [id]);
    return rows[0];
  },
};

export default User;
