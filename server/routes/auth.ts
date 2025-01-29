import express from 'express';
import { db } from "../db";
import passport from "passport";
import { crypto } from '../auth/crypto';
import bcrypt from 'bcrypt';
import { z } from 'zod';
import { sendPasswordResetEmail } from '../services/email';

const router = express.Router();

// Update validation schema
const authSchema = z.object({
  username: z.string().min(3),
  password: z.string().min(6),
  email: z.string().email()
});

router.post('/register', async (req, res) => {
  try {
    const hashedPassword = await crypto.hash(req.body.password);
    await db.query(
      'INSERT INTO users (username, password, email) VALUES ($1, $2, $3)',
      [req.body.username, hashedPassword, req.body.email]
    );
    res.status(201).json({ message: 'User created' });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

router.post('/login', async (req, res, next) => {
  try {
    passport.authenticate('local', async (err: any, user: any, info: any) => {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ error: 'Server error' });
      }
      
      if (!user) {
        console.log('Authentication failed:', info.message);
        return res.status(401).json({ error: info.message });
      }

      req.logIn(user, (err) => {
        if (err) {
          console.error('Session error:', err);
          return next(err);
        }
        return res.json({ 
          message: 'Logged in successfully',
          user: {
            id: user.id,
            username: user.username,
            email: user.email
          }
        });
      });
    })(req, res, next);
  } catch (error) {
    console.error('Unexpected login error:', error);
    return res.status(500).json({ error: 'An unexpected error occurred' });
  }
});

router.post('/request-reset', async (req, res) => {
  const { email } = req.body;
  
  try {
    // Find user by email (add email column to users table if needed)
    const userResult = await db.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    if (userResult.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 3600000); // 1 hour
    
    await db.query(
      'INSERT INTO password_resets (user_id, token, expires_at) VALUES ($1, $2, $3)',
      [userResult.rows[0].id, token, expiresAt]
    );

    // After inserting the token
    await sendPasswordResetEmail(email, token);
    res.json({ message: 'Reset instructions sent to your email' });
  } catch (error) {
    console.error('Email send error:', error);
    res.status(500).json({ error: 'Failed to send reset email' });
  }
});

router.post('/reset-password', async (req, res) => {
  const { token, newPassword } = req.body;
  
  try {
    // Validate token and update password
    const result = await db.query(
      `UPDATE users SET password = $1
       WHERE id = (
         SELECT user_id FROM password_resets
         WHERE token = $2 AND expires_at > NOW()
       ) RETURNING id`,
      [await bcrypt.hash(newPassword, 12), token]
    );

    if (result.rowCount === 0) {
      return res.status(400).json({ error: 'Invalid or expired token' });
    }

    await db.query('DELETE FROM password_resets WHERE token = $1', [token]);
    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
}); 