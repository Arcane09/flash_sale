const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.PORT || 8080;

const DB_CONFIG = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  database: process.env.DB_NAME || 'flashsale_db',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'password',
  dialect: process.env.DB_DIALECT || 'mysql',
};

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const JWT_SECRET = process.env.JWT_SECRET || 'supersecret_jwt_key';
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

module.exports = {
  PORT,
  DB_CONFIG,
  REDIS_URL,
  JWT_SECRET,
  CORS_ORIGIN,
};


