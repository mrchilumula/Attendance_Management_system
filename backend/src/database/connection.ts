import mysql from 'mysql2/promise';
import { config } from '../config';

// Create MySQL connection pool with optimized settings
const pool = mysql.createPool({
  host: config.db.host,
  port: config.db.port,
  user: config.db.user,
  password: config.db.password,
  database: config.db.database,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  // Keep connections alive
  enableKeepAlive: true,
  keepAliveInitialDelay: 10000, // 10 seconds
  // Connection timeout settings
  connectTimeout: 10000, // 10 seconds
  // Idle timeout - close idle connections after 5 minutes
  idleTimeout: 300000,
});

// Keep pool warm by pinging every 4 minutes
setInterval(async () => {
  try {
    await pool.query('SELECT 1');
    console.log('[DB] Connection pool keep-alive ping');
  } catch (err) {
    console.error('[DB] Keep-alive ping failed:', err);
  }
}, 240000); // 4 minutes

export default pool;
