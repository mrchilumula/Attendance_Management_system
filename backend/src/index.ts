import express from 'express';
import cors from 'cors';
import mysql from 'mysql2/promise';
import { config } from './config';
import initDatabase from './database/init';
import seedDatabase from './database/seed';

// Import routes
import authRoutes from './routes/auth';
import attendanceRoutes from './routes/attendance';
import reportsRoutes from './routes/reports';
import adminRoutes from './routes/admin';
import uploadRoutes from './routes/upload';
import chatbotRoutes from './routes/chatbot';

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    success: true, 
    message: `${config.collegeName} Attendance Management System`,
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/chatbot', chatbotRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, error: 'Endpoint not found' });
});

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, error: 'Internal server error' });
});

// Initialize database and start server
async function startServer() {
  try {
    // First, create the database if it doesn't exist
    const connection = await mysql.createConnection({
      host: config.db.host,
      port: config.db.port,
      user: config.db.user,
      password: config.db.password,
    });
    
    await connection.execute(`CREATE DATABASE IF NOT EXISTS ${config.db.database}`);
    await connection.end();
    
    // Initialize tables
    await initDatabase();
    
    // Seed data
    await seedDatabase();
    
    // Start server
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`
╔════════════════════════════════════════════════════════════════╗
║                                                                ║
║   🎓 ${config.collegeName}                ║
║   📋 Attendance Management System                              ║
║                                                                ║
║   Server running on: http://localhost:${PORT}                    ║
║   API Base URL: http://localhost:${PORT}/api                     ║
║   Database: MySQL (${config.db.database})                        ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
      `);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export default app;
