import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get all users (used by checkins, team view, shared goals)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        username: true, roles: true, managerId: true
      },
      orderBy: { firstName: 'asc' }
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve users' } });
  }
});

// Get direct reports for a manager (Requirement 8)
router.get('/:id/reports', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const reports = await prisma.user.findMany({
      where: { managerId: String(id), isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true, roles: true,
        goalSheets: {
          orderBy: { updatedAt: 'desc' },
          take: 1,
          select: { id: true, status: true, updatedAt: true }
        }
      }
    });
    res.json(reports);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve direct reports' } });
  }
});

// Get user profile
router.get('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: String(id) },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        roles: true, managerId: true,
        manager: { select: { id: true, firstName: true, lastName: true } }
      }
    });
    if (!user) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
      return;
    }
    res.json(user);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve user profile' } });
  }
});

export default router;