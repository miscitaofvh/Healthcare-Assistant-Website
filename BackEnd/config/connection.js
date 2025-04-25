import mysql from "mysql2/promise";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

if (missingEnvVars.length > 0) {
    throw new Error(`Missing required environment variables: ${missingEnvVars.join(', ')}`);
}

// Database configuration with type validation
const dbConfig = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: parseInt(process.env.DB_PORT || '3306'),
    connectionLimit: parseInt(process.env.DB_CONNECTION_LIMIT || '10'),
    waitForConnections: true,
    queueLimit: 0,
    enableKeepAlive: true,
    keepAliveInitialDelay: 0,
    // Thêm các tùy chọn bảo mật
    ssl: process.env.DB_SSL === 'true' ? {
        rejectUnauthorized: true
    } : undefined,
    // Thêm timeout settings
    connectTimeout: 10000,
    acquireTimeout: 10000,
    timeout: 10000
};

// Tạo connection pool với error handling
let pool;
try {
    pool = mysql.createPool(dbConfig);
    console.log('✅ Connection pool created successfully');
} catch (error) {
    console.error('❌ Error creating connection pool:', error);
    throw new Error('Failed to initialize database connection pool');
}

// Hàm kiểm tra kết nối với retry mechanism
const testConnection = async (retries = 3, delay = 1000) => {
    for (let i = 0; i < retries; i++) {
        try {
            const connection = await pool.getConnection();
            console.log('✅ Database connection successful!');
            
            // Kiểm tra version của database
            const [version] = await connection.query('SELECT VERSION() as version');
            console.log(`✅ Connected to MySQL version: ${version[0].version}`);
            
            connection.release();
            return true;
        } catch (error) {
            console.error(`❌ Connection attempt ${i + 1} failed:`, error.message);
            if (i < retries - 1) {
                console.log(`Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    return false;
};

// Hàm đóng pool an toàn
const closePool = async () => {
    try {
        await pool.end();
        console.log('✅ Database connection pool closed successfully');
    } catch (error) {
        console.error('❌ Error closing connection pool:', error);
        throw new Error('Failed to close database connection pool');
    }
};

// Hàm lấy connection với timeout
const getConnection = async (timeout = 5000) => {
    try {
        const connection = await Promise.race([
            pool.getConnection(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error('❌ Connection timeout')), timeout)
            )
        ]);
        return connection;
    } catch (error) {
        console.error('❌ Error getting connection:', error);
        throw new Error('Failed to get database connection');
    }
};

// Export các hàm và pool
export { 
    pool as default, 
    testConnection, 
    closePool,
    getConnection
}; 