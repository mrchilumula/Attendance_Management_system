import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import pool from '../database/connection';
import { config } from '../config';
import { User, JwtPayload } from '../types';
import { authenticate } from '../middleware/auth';
import { RowDataPacket } from 'mysql2';

const router = Router();

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
        WHERE u.email = ? AND u.is_active = 1
      `, [email]);

      const user = rows[0] as (User & { department_name?: string; department_code?: string }) | undefined;

      if (!user) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        res.status(401).json({ success: false, error: 'Invalid email or password' });
        return;
      }

      const payload: JwtPayload = {
        userId: user.id,
        email: user.email,
        role: user.role,
      };

      const token = jwt.sign(payload, config.jwtSecret);

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
      SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.phone,
             d.name as department_name, d.code as department_code
      FROM users u
      LEFT JOIN departments d ON u.department_id = d.id
      WHERE u.id = ?
    `, [req.user!.userId]);

    const user = rows[0] as User & { department_name?: string; department_code?: string };

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
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  async (req: Request, res: Response): Promise<void> => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ success: false, errors: errors.array() });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    try {
      const [rows] = await pool.execute<RowDataPacket[]>('SELECT password FROM users WHERE id = ?', [req.user!.userId]);
      const user = rows[0] as { password: string };

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        res.status(400).json({ success: false, error: 'Current password is incorrect' });
        return;
      }

      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await pool.execute('UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [
        hashedPassword,
        req.user!.userId
      ]);

      res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
      console.error('Change password error:', error);
      res.status(500).json({ success: false, error: 'Internal server error' });
    }
  }
);

export default router;
