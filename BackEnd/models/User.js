import connection from "../config/db.js";
import bcrypt from "bcrypt";

export const findUserByUsernameOrEmail = async (username, email) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = "SELECT username, email FROM users WHERE username = ? OR email = ?";
        const [existingUsers] = await conn.execute(sql, [username, email]);

        await conn.commit();
        return existingUsers.length > 0 ? existingUsers[0] : null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tìm kiếm user:", error);
        throw new Error("Không thể tìm kiếm thông tin người dùng");
    } finally {
        if (conn) conn.release();
    }
};

export const createUser = async ({ username, email, password }) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const existingUser = await findUserByUsernameOrEmail(username, email);
        if (existingUser) {
            if (existingUser.username === username) {
                throw new Error("Username đã tồn tại");
            }
            if (existingUser.email === email) {
                throw new Error("Email đã tồn tại");
            }
        }

        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        const sql = `INSERT INTO users (username, email, password_hash, created_at) 
                    VALUES (?, ?, ?, NOW())`;
        const [result] = await conn.execute(sql, [username, email, passwordHash]);

        await conn.commit();
        return result.insertId;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tạo user:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const findUserByLoginField = async (loginField) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = loginField.includes("@")
            ? `SELECT user_id, email, password_hash FROM users WHERE email = ?`
            : `SELECT user_id, username, password_hash FROM users WHERE username = ?`;
        const [rows] = await conn.execute(sql, [loginField]);

        await conn.commit();
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tìm kiếm user để đăng nhập:", error);
        throw new Error("Không thể tìm kiếm thông tin người dùng");
    } finally {
        if (conn) conn.release();
    }
};

export const loginUser = async (loginField, password) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const user = await findUserByLoginField(loginField);
        if (!user) {
            throw new Error("Tên đăng nhập hoặc email không tồn tại");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password_hash);
        if (!isPasswordValid) {
            throw new Error("Mật khẩu không chính xác");
        }

        await updateUserLastLogin(user.user_id);

        const { password_hash, ...userWithoutPassword } = user;

        await conn.commit();
        return userWithoutPassword;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi đăng nhập:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};

export const updateUserLastLogin = async (userId) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `UPDATE users 
                    SET last_login = NOW() 
                    WHERE user_id = ?`;
        await conn.execute(sql, [userId]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi cập nhật thời gian đăng nhập:", error);
        throw new Error("Không thể cập nhật thời gian đăng nhập");
    } finally {
        if (conn) conn.release();
    }
};
