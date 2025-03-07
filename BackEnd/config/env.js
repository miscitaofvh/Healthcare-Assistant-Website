// require('dotenv').config();
require('dotenv').config({ path: '../.env' });

module.exports = {
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_USER: process.env.DB_USER || 'root',
  DB_PASSWORD: process.env.DB_PASSWORD || '',
  DB_NAME: process.env.DB_NAME || 'project_db',
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key',
  PORT: process.env.PORT || 5000,
};