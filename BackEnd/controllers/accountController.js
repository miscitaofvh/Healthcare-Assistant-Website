export const getUser = async (req, res) => {
    const { id } = req.params;
    try {
        const [results] = await db.execute('SELECT * FROM users WHERE user_id = ?', [id]);
        if (results.length === 0) {
            return res.status(404).json({ success: false, error: "User not found" });
        }
        return res.json({ success: true, user: results[0] });
    }
    catch (err) {
        console.error("❌ Database error:", err);
        return res.status(500).json({ success: false, error: "Internal server error" });
    }
};
