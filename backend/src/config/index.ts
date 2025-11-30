export const config = {
  port: process.env.PORT || 5000,
  jwtSecret: process.env.JWT_SECRET || 'crrao-attendance-secret-key-2025',
  jwtExpiresIn: '7d',
  
  // MySQL Database Configuration
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',  // Set your MySQL password here
    database: process.env.DB_NAME || 'attendance_management',
  },
  
  collegeName: 'CR Rao Institute of Technology',
  collegeCode: 'CRRIT'
};
