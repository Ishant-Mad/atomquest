import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Create a Shared Goal and push to employees
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, thrustArea, uom, target, optimizationDirection, primaryOwnerId, createdBy, employeeIds } = req.body;

    // Validate inputs
    if (!title || !thrustArea || !uom || !target || !primaryOwnerId || !createdBy || !employeeIds || !employeeIds.length) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
      return;
    }

    // Since a cycle might not be provided, we'll assume the current active cycle.
    const activeCycle = await prisma.performanceCycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) {
      res.status(400).json({ error: { code: 'NOT_FOUND', message: 'No active performance cycle found' } });
      return;
    }

    // Validation: Check if any recipient would exceed 8 goals
    const overloadedEmployees = [];
    for (const empId of employeeIds) {
      const sheet = await prisma.goalSheet.findFirst({
        where: { employeeId: empId, cycleId: activeCycle.id },
        include: { _count: { select: { goals: true } } },
        orderBy: { createdAt: 'desc' }
      });
      if (sheet && sheet._count.goals >= 8) {
        // fetch user to get name for error message
        const user = await prisma.user.findUnique({ where: { id: empId } });
        overloadedEmployees.push(user ? `${user.firstName} ${user.lastName}` : empId);
      }
    }

    if (overloadedEmployees.length > 0) {
      res.status(400).json({ 
        error: { 
          code: 'VALIDATION_ERROR', 
          message: `Push blocked: The following employees would exceed the maximum of 8 goals: ${overloadedEmployees.join(', ')}` 
        } 
      });
      return;
    }

    // Use transaction to ensure consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create the SharedGoal
      const sharedGoal = await tx.sharedGoal.create({
        data: {
          title,
          description,
          thrustArea,
          uom,
          target,
          optimizationDirection,
          primaryOwnerId,
          createdBy
        }
      });

      const createdGoals = [];

      for (const empId of employeeIds) {
        // Find existing draft or active sheet
        let sheet = await tx.goalSheet.findFirst({
          where: { employeeId: empId, cycleId: activeCycle.id },
          orderBy: { createdAt: 'desc' }
        });

        if (!sheet) {
          // Create new draft sheet
          sheet = await tx.goalSheet.create({
            data: {
              employeeId: empId,
              cycleId: activeCycle.id,
              status: 'DRAFT',
            }
          });
        }

        // Add the shared goal to their sheet with 0 weightage (they must adjust it later)
        const goal = await tx.goal.create({
          data: {
            goalSheetId: sheet.id,
            thrustArea,
            title,
            description,
            uom,
            target,
            optimizationDirection,
            weightage: 0,
            isShared: true,
            sharedGoalId: sharedGoal.id,
            isPrimaryOwner: empId === primaryOwnerId
          }
        });
        
        createdGoals.push(goal);
      }

      return { sharedGoal, pushedCount: createdGoals.length };
    });

    res.status(201).json(result);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create shared goal' } });
  }
});

// Update achievement for a Shared Goal
router.post('/:id/achievements', async (req: Request, res: Response): Promise<void> => {
  try {
    const id = req.params.id as string;
    const { quarter, actual, status, progressScore, primaryOwnerId } = req.body;

    const sharedGoal = await prisma.sharedGoal.findUnique({
      where: { id },
      include: { linkedGoals: true }
    });

    if (!sharedGoal) {
      res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Shared goal not found' } });
      return;
    }

    if (sharedGoal.primaryOwnerId !== primaryOwnerId) {
      res.status(403).json({ error: { code: 'FORBIDDEN', message: 'Only primary owner can update achievements' } });
      return;
    }

    // Sync achievement to all linked goals
    await prisma.$transaction(async (tx) => {
      const linkedGoals = (sharedGoal as any).linkedGoals;
      for (const linkedGoal of linkedGoals) {
        // Find existing achievement for this quarter or create new
        const existing = await tx.achievement.findFirst({
          where: { goalId: linkedGoal.id, quarter }
        });

        if (existing) {
          await tx.achievement.update({
            where: { id: existing.id },
            data: { actual, status, progressScore, updatedAt: new Date() }
          });
        } else {
          await tx.achievement.create({
            data: {
              goalId: linkedGoal.id,
              quarter,
              actual,
              status,
              progressScore
            }
          });
        }
      }
    });

    res.json({ success: true, message: 'Achievements synchronized' });
  } catch (error: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update achievements' } });
  }
});

export default router;
