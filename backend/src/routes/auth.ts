import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection';
import { config } from '../config';
import { User, JwtPayload } from '../types';
import { authenticate } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

// Password validation rules
const passwordValidation = [
  body('newPassword')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
    .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain at least one lowercase letter')
    .matches(/[0-9]/).withMessage('Password must contain at least one number')
    .matches(/[!@#$%^&*(),.?":{}|<>]/).withMessage('Password must contain at least one special character'),
];

// Constants for security
const MAX_LOGIN_ATTEMPTS = 5;
const LOCK_TIME_MINUTES = 15;
const JWT_EXPIRY = '24h';
const RESET_TOKEN_EXPIRY_HOURS = 1;

// Generate secure reset token
const generateResetToken = (): string => {
  return crypto.randomBytes(32).toString('hex');
};

// Login
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email, password } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(`
        SELECT u.*, d.name as department_name, d.code as department_code
        FROM users u
        LEFT JOIN departments d ON u.department_id = d.id
        WHERE u.email = ?
      `, [email]);

      const user = rows[0] as (User & { 
        department_name?: string; 
        department_code?: string;
        must_change_password?: number;
        login_attempts?: number;
        locked_until?: Date;
      }) | undefined;

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        const remainingMinutes = Math.ceil((new Date(user.locked_until).getTime() - Date.now()) / 60000);
        res.status(423).json({ 
          success: false, 
          error: `Account is locked. Try again in ${remainingMinutes} minute(s).`,
          locked: true,
          lockedUntil: user.locked_until
        });
        return;
      }

      // Check if account is active
      if (!user.is_active) {
        res.status(403).json({ success: false, error: 'Account is deactivated. Contact administrator.' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = (user.login_attempts || 0) + 1;
        
        if (newAttempts >= MAX_LOGIN_ATTEMPTS) {
          // Lock the account
          const lockUntil = new Date(Date.now() + LOCK_TIME_MINUTES * 60 * 1000);
          await pool.execute(
            'UPDATE users SET login_attempts = ?, locked_until = ? WHERE id = ?',
            [newAttempts, lockUntil, user.id]
          );
          res.status(423).json({ 
            success: false, 
            error: `Too many failed attempts. Account locked for ${LOCK_TIME_MINUTES} minutes.`,
            locked: true
          });
          return;
        }
        
        await pool.execute(
          'UPDATE users SET login_attempts = ? WHERE id = ?',
          [newAttempts, user.id]
        );
        
        const remainingAttempts = MAX_LOGIN_ATTEMPTS - newAttempts;
        res.status(401).json({ 
          success: false, 
          error: `Invalid password. ${remainingAttempts} attempt(s) remaining.`
        });
        return;
      }

      // Reset login attempts and update last login
      await pool.execute(
        'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login_at = CURRENT_TIMESTAMP WHERE id = ?',
        [user.id]
      );

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, config.jwtSecret, { expiresIn: JWT_EXPIRY });

      // Check if password change is required
      const mustChangePassword = user.must_change_password === 1;

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            email: user.email,
            firstName: user.first_name,
            lastName: user.last_name,
            role: user.role,
            department: user.department_name,
            departmentCode: user.department_code,
            mustChangePassword,
          },
        },
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Get current user profile
router.get('/me', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.must_change_password,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.user!.userId]);

    const user = rows[0] as User & { 
      department_name?: string; 
      department_code?: string;
      must_change_password: number;
    };

    if (!user) {
      res.status(404).json({ success: false, error: 'User not found' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        department: user.department_name,
        departmentCode: user.department_code,
        mustChangePassword: user.must_change_password === 1,
      },
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Change password
router.put(
  '/change-password',
  authenticate,
  [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    ...passwordValidation,
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT password FROM users WHERE id = ?', 
        [req.user!.userId]
      );
      const user = rows[0] as { password: string };

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, error: 'Current password is incorrect' });
        return;
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        res.status(400).json({ success: false, error: 'New password must be different from current password' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        `UPDATE users SET 
          password = ?, 
          must_change_password = 0, 
          password_changed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`, 
        [hashedPassword, req.user!.userId]
      );

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Force change password (for first login)
router.post(
  '/force-change-password',
  authenticate,
  [...passwordValidation],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { newPassword } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT password, must_change_password FROM users WHERE id = ?', 
        [req.user!.userId]
      );
      const user = rows[0] as { password: string; must_change_password: number };

      if (!user) {
        res.status(404).json({ success: false, error: 'User not found' });
        return;
      }

      // Check if new password is same as current (default password)
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        res.status(400).json({ success: false, error: 'New password must be different from the default password' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        `UPDATE users SET 
          password = ?, 
          must_change_password = 0, 
          password_changed_at = CURRENT_TIMESTAMP,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`, 
        [hashedPassword, req.user!.userId]
      );

      res.json({ success: true, message: 'Password changed successfully. You can now use all features.' });
    } catch (error) {
      console.error('Force change password error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Validate token (for session refresh)
router.get('/validate', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(`
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone, u.must_change_password,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ? AND u.is_active = 1
    `, [req.user!.userId]);

    const user = rows[0] as User & { 
      department_name?: string; 
      department_code?: string;
      must_change_password: number;
    };

    if (!user) {
      res.status(401).json({ success: false, error: 'Invalid session' });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        role: user.role,
        phone: user.phone,
        department: user.department_name,
        departmentCode: user.department_code,
        mustChangePassword: user.must_change_password === 1,
      },
    });
  } catch (error) {
    console.error('Validate token error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Forgot Password - Request reset token
router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { email } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id, email, first_name, is_active FROM users WHERE email = ?',
        [email]
      );
      
      const user = rows[0] as { id: string; email: string; first_name: string; is_active: boolean } | undefined;

      // Always return success to prevent email enumeration
      if (!user || !user.is_active) {
        res.json({ 
          success: true, 
          message: 'If an account exists with this email, a reset code has been generated.',
          // In production, you would send an email here
        });
        return;
      }

      // Generate reset token
      const resetToken = generateResetToken();
      const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');
      const resetExpiry = new Date(Date.now() + RESET_TOKEN_EXPIRY_HOURS * 60 * 60 * 1000);

      // Store hashed token in database
      await pool.execute(
        `UPDATE users SET 
          reset_token = ?, 
          reset_token_expiry = ?,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [resetTokenHash, resetExpiry, user.id]
      );

      // In production, send email with reset link
      // For demo, we'll return the token (REMOVE IN PRODUCTION!)
      console.log(`Password reset requested for ${email}. Token: ${resetToken}`);

      res.json({ 
        success: true, 
        message: 'If an account exists with this email, a reset code has been generated.',
        // DEMO ONLY - Remove in production
        resetToken: resetToken,
        expiresAt: resetExpiry,
        hint: 'In production, this token would be sent via email'
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Verify Reset Token
router.post(
  '/verify-reset-token',
  [body('token').notEmpty().withMessage('Reset token is required')],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { token } = req.body;

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, email, first_name, reset_token_expiry 
         FROM users 
         WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_active = 1`,
        [tokenHash]
      );

      const user = rows[0] as { id: string; email: string; first_name: string } | undefined;

      if (!user) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid or expired reset token. Please request a new one.' 
        });
        return;
      }

      res.json({ 
        success: true, 
        message: 'Token is valid',
        data: {
          email: user.email,
          firstName: user.first_name
        }
      });
    } catch (error) {
      console.error('Verify reset token error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Reset Password with token
router.post(
  '/reset-password',
  [
    body('token').notEmpty().withMessage('Reset token is required'),
    ...passwordValidation,
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { token, newPassword } = req.body;

    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const [rows] = await pool.execute<RowDataPacket[]>(
        `SELECT id, email, password, reset_token_expiry 
         FROM users 
         WHERE reset_token = ? AND reset_token_expiry > NOW() AND is_active = 1`,
        [tokenHash]
      );

      const user = rows[0] as { id: string; email: string; password: string } | undefined;

      if (!user) {
        res.status(400).json({ 
          success: false, 
          error: 'Invalid or expired reset token. Please request a new one.' 
        });
        return;
      }

      // Check if new password is same as current
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        res.status(400).json({ 
          success: false, 
          error: 'New password must be different from your previous password' 
        });
        return;
      }

      // Hash new password and update
      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await pool.execute(
        `UPDATE users SET 
          password = ?, 
          reset_token = NULL, 
          reset_token_expiry = NULL,
          must_change_password = 0,
          password_changed_at = CURRENT_TIMESTAMP,
          login_attempts = 0,
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [hashedPassword, user.id]
      );

      res.json({ 
        success: true, 
        message: 'Password has been reset successfully. You can now login with your new password.' 
      });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Unlock Account (Admin only)
router.post(
  '/unlock-account',
  authenticate,
  [body('userId').notEmpty().withMessage('User ID is required')],
  async (req: Request, res: Response): Promise<void> => {
    // Only admin can unlock accounts
    if (req.user!.role !== 'admin') {
      res.status(403).json({ success: false, error: 'Only administrators can unlock accounts' });
      return;
    }

    const { userId } = req.body;

    try {
      await pool.execute(
        `UPDATE users SET 
          login_attempts = 0, 
          locked_until = NULL,
          updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?`,
        [userId]
      );

      res.json({ success: true, message: 'Account unlocked successfully' });
    } catch (error) {
      console.error('Unlock account error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

// Get Login History (for user)
router.get('/login-history', authenticate, async (req: Request, res: Response): Promise<void> => {
  try {
    const [rows] = await pool.execute<RowDataPacket[]>(
      `SELECT last_login_at, login_attempts, locked_until 
       FROM users WHERE id = ?`,
      [req.user!.userId]
    );

    const user = rows[0] as { 
      last_login_at: Date; 
      login_attempts: number; 
      locked_until: Date | null 
    };

    res.json({
      success: true,
      data: {
        lastLogin: user.last_login_at,
        failedAttempts: user.login_attempts,
        lockedUntil: user.locked_until
      }
    });
  } catch (error) {
    console.error('Login history error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Check if email exists (for registration hints)
router.post(
  '/check-email',
  [body('email').isEmail().withMessage('Valid email is required')],
  async (req: Request, res: Response): Promise<void> => {
    const { email } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>(
        'SELECT id FROM users WHERE email = ?',
        [email]
      );

      // Don't reveal if email exists for security
      res.json({ 
        success: true, 
        // Only hint at email format validity
        validFormat: email.endsWith('@crrit.edu.in')
      });
    } catch (error) {
      console.error('Check email error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
