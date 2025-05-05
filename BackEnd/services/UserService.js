import connection from '../config/connection.js';

export class UserService {
    static async getById(userId) {
        // Database operation
        const [user] = await connection.execute(
            "SELECT user_id, username, role FROM users WHERE user_id = ?",
            [userId]
        );
        return user[0] || null;
    }

    static async isAdmin(userId) {
        const user = await this.getById(userId);
        return user?.role === 'admin';
    }

    // Other methods...
    // updateUser(), searchUsers(), etc.
}