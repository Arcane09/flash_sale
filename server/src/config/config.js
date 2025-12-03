const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') });

const PORT = process.env.PORT || 8080;

// Support either individual DB_* env vars or a single connection string
// such as DATABASE_URL from Railway or other hosts.
const CONNECTION_URL = process.env.DATABASE_URL || process.env.DB_URL;

let DB_CONFIG;

if (CONNECTION_URL) {
  // Example: mysql://user:pass@host:port/dbname
  const url = new URL(CONNECTION_URL);
  const [username, password] = (url.username || url.password)
    ? [decodeURIComponent(url.username), decodeURIComponent(url.password)]
    : [process.env.DB_USER || 'root', process.env.DB_PASS || 'password'];

  DB_CONFIG = {
    host: url.hostname,
    port: Number(url.port) || 3306,
    database: url.pathname.replace(/^\//, '') || process.env.DB_NAME || 'flashsale_db',
    username,
    password,
    dialect: process.env.DB_DIALECT || url.protocol.replace(':', '') || 'mysql',
  };
} else {
  DB_CONFIG = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    database: process.env.DB_NAME || 'flashsale_db',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || 'password',
    dialect: process.env.DB_DIALECT || 'mysql',
  };
}

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


