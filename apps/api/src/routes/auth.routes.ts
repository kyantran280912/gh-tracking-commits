import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { DatabaseService } from '@repo/database';
import { loginSchema, registerSchema } from '@repo/shared';
import { validateBody } from '../middleware/validation.middleware.js';
import { getEnv } from '../config/env.js';
import { authenticateToken, AuthRequest } from '../middleware/auth.middleware.js';

export function createAuthRouter(db: DatabaseService): Router {
  const router = Router();
  const env = getEnv();

  // POST /api/auth/register - Register new user
  router.post('/register', validateBody(registerSchema), async (req, res, next) => {
    try {
      const { email, username, password } = req.body;

      // Check if user already exists
      const existingUser = await db.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({
          success: false,
          error: 'Email already registered',
        });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user (default role: viewer)
      const user = await db.createUser({
        email,
        username,
        passwordHash,
        role: 'viewer',
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
      );

      // Log audit
      await db.createAuditLog({
        userId: user.id,
        action: 'USER_REGISTERED',
        details: { email, username },
        ipAddress: req.ip,
      });

      res.status(201).json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/login - Login user
  router.post('/login', validateBody(loginSchema), async (req, res, next) => {
    try {
      const { email, password } = req.body;

      // Get user with password
      const user = await db.getUserWithPassword(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({
          success: false,
          error: 'Invalid email or password',
        });
      }

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role,
        },
        env.JWT_SECRET,
        { expiresIn: env.JWT_EXPIRES_IN } as SignOptions
      );

      // Update last login
      await db.updateLastLogin(user.id);

      // Log audit
      await db.createAuditLog({
        userId: user.id,
        action: 'USER_LOGIN',
        details: { email },
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        data: {
          user: {
            id: user.id,
            email: user.email,
            username: user.username,
            role: user.role,
          },
          token,
        },
      });
    } catch (error) {
      next(error);
    }
  });

  // GET /api/auth/me - Get current user info
  router.get('/me', authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      const user = await db.getUserById(req.user!.userId);

      if (!user) {
        return res.status(404).json({
          success: false,
          error: 'User not found',
        });
      }

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      next(error);
    }
  });

  // POST /api/auth/logout - Logout (client-side handles token removal)
  router.post('/logout', authenticateToken, async (req: AuthRequest, res, next) => {
    try {
      // Log audit
      await db.createAuditLog({
        userId: req.user!.userId,
        action: 'USER_LOGOUT',
        ipAddress: req.ip,
      });

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  });

  return router;
}
