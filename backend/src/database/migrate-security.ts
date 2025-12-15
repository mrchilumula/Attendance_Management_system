import mysql from 'mysql2/promise';

async function migrate() {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'attendance_management'
  });
  
  console.log('🔧 Running security columns migration...');
  
  const alterStatements = [
    `ALTER TABLE users ADD COLUMN must_change_password TINYINT DEFAULT 1`,
    `ALTER TABLE users ADD COLUMN password_changed_at DATETIME DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN last_login_at DATETIME DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN login_attempts INT DEFAULT 0`,
    `ALTER TABLE users ADD COLUMN locked_until DATETIME DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) DEFAULT NULL`,
    `ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME DEFAULT NULL`
  ];
  
  for (const sql of alterStatements) {
    try {
      await pool.execute(sql);
      console.log('✅ Added column:', sql.match(/ADD COLUMN (\w+)/)?.[1]);
    } catch (e: any) {
      if (e.code === 'ER_DUP_FIELDNAME') {
        console.log('⏭️  Column already exists:', sql.match(/ADD COLUMN (\w+)/)?.[1]);
      } else {
        console.error('❌ Error:', e.message);
      }
    }
  }
  
  // Set admin to require password change for testing first login flow
  try {
    await pool.execute('UPDATE users SET must_change_password = 1 WHERE email = ?', ['admin@crrit.edu.in']);
    console.log('✅ Admin user set to REQUIRE password change (for testing)');
  } catch (e: any) {
    console.error('❌ Error updating admin:', e.message);
  }
  
  await pool.end();
  console.log('✅ Migration complete!');
}

migrate().catch(console.error);
