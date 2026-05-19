import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Compute progress score helper (Requirement 6)
function computeProgressScore(uom: string, target: string, actual: string, optDir?: string | null): number {
  if (uom === 'ZERO_BASED') {
    return parseFloat(actual) === 0 ? 100 : 0;
  }
  
  if (uom === 'TIMELINE') {
    // 100% if on or before deadline, else 0%
    const targetDate = new Date(target).getTime();
    const actualDate = new Date(actual).getTime();
    if (isNaN(targetDate) || isNaN(actualDate)) return 0;
    return actualDate <= targetDate ? 100 : 0;
  }

  // NUMERIC or PERCENTAGE
  const numTarget = parseFloat(target);
  const numActual = parseFloat(actual);
  
  if (isNaN(numTarget) || isNaN(numActual)) return 0;

  let score = 0;
  if (optDir === 'lower_better') {
    if (numActual === 0) return 100; // Prevent division by zero
    score = (numTarget / numActual) * 100;
  } else {
    // higher_better
    if (numTarget === 0) return numActual > 0 ? 100 : 0;
    score = (numActual / numTarget) * 100;
  }
  
  return Math.min(Math.max(score, 0), 100);
}

// Record quarterly achievement (Requirement 4)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { goalId, quarter, actual, status } = req.body;

    const goal = await prisma.goal.findUnique({ where: { id: goalId } });
    if (!goal) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Goal not found' } });
      return;
    }

    const progressScore = computeProgressScore(goal.uom, goal.target, actual, goal.optimizationDirection);

    const achievement = await prisma.achievement.create({
      data: {
        goalId,
        quarter: quarter,
        actual: String(actual),
        status: status,
        progressScore
      }
    });

    res.status(201).json(achievement);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to record achievement' } });
  }
});

// Get achievement history for goal
router.get('/goal/:goalId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { goalId } = req.params;
    const achievements = await prisma.achievement.findMany({
      where: { goalId: String(goalId) },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(achievements);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve achievements' } });
  }
});

export default router;