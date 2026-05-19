import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Conduct a check-in (Requirement 5)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { managerId, employeeId, goalSheetId, quarter, feedback } = req.body;
    
    // Validate quarter enum
    if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid quarter' } });
      return;
    }

    const checkIn = await prisma.checkIn.create({
      data: {
        managerId,
        employeeId,
        goalSheetId,
        quarter,
        feedback,
        isCompleted: true,
        completedAt: new Date()
      }
    });

    res.status(201).json(checkIn);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create check-in' } });
  }
});

// Get check-in history for an employee
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const checkIns = await prisma.checkIn.findMany({
      where: { employeeId: String(employeeId) },
      orderBy: { createdAt: 'desc' }
    });
    res.json(checkIns);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve check-ins' } });
  }
});

export default router;