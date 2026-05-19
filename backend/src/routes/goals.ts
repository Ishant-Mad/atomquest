import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get goal sheets by employee (Requirement 2 & 13)
router.get('/employee/:employeeId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId } = req.params;
    const goalSheets = await prisma.goalSheet.findMany({
      where: { employeeId: String(employeeId) },
      include: {
        goals: {
          include: { achievements: true }
        },
        cycle: true
      }
    });
    res.json(goalSheets);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve goal sheets' } });
  }
});

// Create new goal sheet (Requirement 1)
router.post('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, cycleId, goals } = req.body;

    // In demo mode: bypass May-only restriction
    const isDemoMode = process.env.DEMO_MODE !== 'false';
    
    // Weightage validation
    const totalWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Total weightage must equal 100%' } });
      return;
    }
    
    const minWeightageValid = goals.every((g: any) => g.weightage >= 10);
    if (!minWeightageValid) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Each goal must have at least 10% weightage' } });
      return;
    }

    // Checking max goals
    if (goals.length < 1 || goals.length > 8) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Goal sheet must have between 1 and 8 goals' } });
      return;
    }

    const newSheet = await prisma.goalSheet.create({
      data: {
        employeeId,
        cycleId,
        status: 'DRAFT',
        goals: {
          create: goals.map((g: any) => ({
            thrustArea: g.thrustArea,
            title: g.title,
            description: g.description,
            uom: g.uom,
            target: g.target,
            weightage: g.weightage,
            optimizationDirection: g.optimizationDirection
          }))
        }
      },
      include: { goals: true }
    });

    res.status(201).json(newSheet);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create goal sheet' } });
  }
});

// Submit goal sheet for approval
router.post('/:id/submit', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // In demo mode: bypass May-only restriction

    const sheet = await prisma.goalSheet.update({
      where: { id: String(id) },
      data: {
        status: 'PENDING_APPROVAL',
        submittedAt: new Date(),
      }
    });

    // TODO: Create Notification constraint triggers
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to submit goal sheet' } });
  }
});

// Edit an existing goal sheet
router.put('/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { goals } = req.body;

    // In demo mode: bypass May-only restriction
    
    // Weightage validation
    const totalWeightage = goals.reduce((sum: number, g: any) => sum + g.weightage, 0);
    if (totalWeightage !== 100) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Total weightage must equal 100%' } });
      return;
    }
    
    const minWeightageValid = goals.every((g: any) => g.weightage >= 10);
    if (!minWeightageValid) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Each goal must have at least 10% weightage' } });
      return;
    }

    if (goals.length < 1 || goals.length > 8) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Goal sheet must have between 1 and 8 goals' } });
      return;
    }

    // Update goal sheet and its goals within a transaction
    const updatedSheet = await prisma.$transaction(async (tx) => {
      // To properly handle shared goals, we should update existing and create new
      const existingGoals = await tx.goal.findMany({ where: { goalSheetId: String(id) } });
      const incomingIds = goals.map((g: any) => g.id).filter(Boolean);

      // Delete goals that are removed
      await tx.goal.deleteMany({
        where: {
          goalSheetId: String(id),
          id: { notIn: incomingIds }
        }
      });

      // Upsert goals
      for (const g of goals) {
        if (g.id) {
          // Check if shared
          const existing = existingGoals.find(eg => eg.id === g.id);
          if (existing?.isShared && !existing.isPrimaryOwner) {
            // Can only update weightage for shared goals
            await tx.goal.update({
              where: { id: g.id },
              data: { weightage: g.weightage }
            });
          } else {
            await tx.goal.update({
              where: { id: g.id },
              data: {
                thrustArea: g.thrustArea,
                title: g.title,
                description: g.description,
                uom: g.uom,
                target: g.target,
                weightage: g.weightage,
                optimizationDirection: g.optimizationDirection
              }
            });
          }
        } else {
          await tx.goal.create({
            data: {
              goalSheetId: String(id),
              thrustArea: g.thrustArea,
              title: g.title,
              description: g.description,
              uom: g.uom,
              target: g.target,
              weightage: g.weightage,
              optimizationDirection: g.optimizationDirection
            }
          });
        }
      }
      
      return tx.goalSheet.findUnique({
        where: { id: String(id) },
        include: { goals: true }
      });
    });

    res.json(updatedSheet);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update goal sheet' } });
  }
});

// Approve goal sheet
router.post('/:id/approve', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { managerId } = req.body; // In real app, comes from JWT

    // In demo mode: bypass July approval cutoff

    const sheet = await prisma.goalSheet.update({
      where: { id: String(id) },
      data: {
        status: 'APPROVED',
        approvedById: managerId,
        approvedAt: new Date(),
        lockDate: new Date()
      }
    });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to approve goal sheet' } });
  }
});

// Return goal sheet for rework
router.post('/:id/return', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // In demo mode: bypass July approval cutoff

    // In real app, we'd add manager comments to the payload
    const sheet = await prisma.goalSheet.update({
      where: { id: String(id) },
      data: {
        status: 'RETURNED'
      }
    });
    res.json(sheet);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to return goal sheet' } });
  }
});

// Get pending goal sheets for a manager
router.get('/pending/:managerId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { managerId } = req.params;
    // Find all employees reporting to this manager
    const employees = await prisma.user.findMany({
      where: { managerId: String(managerId) },
      select: { id: true }
    });
    
    const employeeIds = employees.map(e => e.id);
    
    // Find all pending goal sheets for these employees
    const goalSheets = await prisma.goalSheet.findMany({
      where: {
        employeeId: { in: employeeIds },
        status: 'PENDING_APPROVAL'
      },
      include: {
        goals: true,
        employee: {
          select: { id: true, firstName: true, lastName: true, username: true }
        }
      }
    });
    res.json(goalSheets);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve pending goal sheets' } });
  }
});

export default router;