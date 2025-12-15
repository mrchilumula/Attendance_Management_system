import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

async function resetPasswords() {
  const pool = mysql.createPool({
    host: 'localhost',
    user: 'root',
    password: 'root',
    database: 'attendance_management'
  });
  
  const defaultPassword = 'password123';
  const hashedPassword = await bcrypt.hash(defaultPassword, 12);
  
  console.log('🔧 Resetting all passwords...');
  
  // Reset all user passwords
  await pool.execute(
    `UPDATE users SET 
      password = ?, 
      must_change_password = 0, 
      login_attempts = 0, 
      locked_until = NULL,
      reset_token = NULL,
      reset_token_expiry = NULL`,
    [hashedPassword]
  );
  
  console.log('✅ All passwords reset to: password123');
  console.log('✅ must_change_password set to 0 (no forced change)');
  console.log('✅ Login attempts reset to 0');
  console.log('✅ Account locks cleared');
  
  // Show users
  const [users] = await pool.execute(
    'SELECT email, role, first_name, last_name FROM users WHERE is_active = 1 ORDER BY role, email LIMIT 15'
  ) as any;
  
  console.log('\n📋 Active Users (password: password123):');
  console.log('─'.repeat(50));
  
  let currentRole = '';
  users.forEach((u: any) => {
    if (u.role !== currentRole) {
      currentRole = u.role;
      console.log(`\n👤 ${currentRole.toUpperCase()}:`);
    }
    console.log(`   ${u.email}`);
  });
  
  console.log('\n─'.repeat(50));
  console.log('🔐 Default password for all users: password123');
  
  await pool.end();
}

resetPasswords().catch(console.error);
