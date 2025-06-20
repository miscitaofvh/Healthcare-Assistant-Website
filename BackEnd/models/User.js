import connection from "../config/connection.js";
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

export const findUserByLoginField = async (loginField) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = loginField.includes("@")
            ? `SELECT user_id, email, role, verified_at, password_hash FROM users WHERE email = ?`
            : `SELECT user_id, username, role, verified_at, password_hash FROM users WHERE username = ?`;
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

export const existUser = async (loginField)  => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();
        const sql = loginField.includes("@")
            ? `SELECT user_id, email, password_hash FROM users WHERE email = ?`
            : `SELECT user_id, username, password_hash FROM users WHERE username = ?`;
        const [rows] = await conn.execute(sql, [loginField]);

        await conn.commit();
        return rows.length > 0;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi tìm kiếm user để đăng nhập:", error);
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
        
        if (!user.verified_at) {
            throw new Error("Tài khoản chưa được xác thực. Vui lòng kiểm tra email.");
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

export const updateUserLastLogin = async (user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const sql = `UPDATE users 
                    SET last_login = NOW() 
                    WHERE user_id = ?`;
        await conn.execute(sql, [user_id]);

        await conn.commit();
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi cập nhật thời gian đăng nhập:", error);
        throw new Error("Không thể cập nhật thời gian đăng nhập");
    } finally {
        if (conn) conn.release();
    }
};

export const getUserById = async (user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();  
        const sql = "SELECT user_id, username, email, role FROM users WHERE user_id = ?"; 
        const [rows] = await conn.execute(sql, [user_id]);

        await conn.commit();
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi lấy thông tin người dùng:", error);
        throw new Error("Không thể lấy thông tin người dùng");
    } finally {
        if (conn) conn.release();
    }
};

export const getUserFullProfileById = async (user_id) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();  
        const sql = `
            SELECT user_id, username, email, full_name, 
                  DATE_FORMAT(dob, '%Y-%m-%d') as dob, 
                  gender, phone_number, address, profile_picture_url 
            FROM users 
            WHERE user_id = ?`; 
        const [rows] = await conn.execute(sql, [user_id]);

        await conn.commit();
        return rows.length > 0 ? rows[0] : null;
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi lấy thông tin đầy đủ người dùng:", error);
        throw new Error("Không thể lấy thông tin đầy đủ người dùng");
    } finally {
        if (conn) conn.release();
    }
};

export const updateUserProfile = async (user_id, profileData) => {
    let conn;
    try {
        conn = await connection.getConnection();
        await conn.beginTransaction();

        const validFields = [
            'full_name', 'dob', 'gender', 'phone_number', 
            'address', 'profile_picture_url'
        ];

        // Filter only valid fields
        const updates = {};
        Object.keys(profileData).forEach(key => {
            if (validFields.includes(key) && profileData[key] !== undefined) {
                updates[key] = profileData[key];
            }
        });

        if (Object.keys(updates).length === 0) {
            throw new Error("Không có thông tin hợp lệ để cập nhật");
        }

        // Build update SQL query
        const fields = Object.keys(updates).map(field => `${field} = ?`).join(', ');
        const values = Object.values(updates);
        
        // Add user_id to values array
        values.push(user_id);

        const sql = `UPDATE users SET ${fields} WHERE user_id = ?`;
        await conn.execute(sql, values);

        await conn.commit();
        return { success: true, message: "Cập nhật thông tin thành công" };
    } catch (error) {
        if (conn) await conn.rollback();
        console.error("Lỗi khi cập nhật thông tin người dùng:", error);
        throw error;
    } finally {
        if (conn) conn.release();
    }
};
