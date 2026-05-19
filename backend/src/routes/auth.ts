import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const router = Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

// Register a new user
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, password, firstName, lastName, roles, managerId } = req.body;
    
    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        firstName,
        lastName,
        roles: roles || 'EMPLOYEE',
        managerId: managerId || null
      }
    });

    const token = jwt.sign({ id: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });

    res.status(201).json({ user: { id: user.id, username: user.username, roles: user.roles }, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
  }
});

// Login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, password } = req.body;
    
    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } });
      return;
    }

    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } });
      return;
    }

    const token = jwt.sign({ id: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });

    res.json({ user: { id: user.id, username: user.username, roles: user.roles, firstName: user.firstName, lastName: user.lastName }, token });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
  }
});

export default router;
