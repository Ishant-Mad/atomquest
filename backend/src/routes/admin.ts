import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = Router();
const prisma = new PrismaClient();

// ─── Performance Cycles ───────────────────────────────────────────────────────

// Get all performance cycles
router.get('/cycles', async (req: Request, res: Response): Promise<void> => {
  try {
    const cycles = await prisma.performanceCycle.findMany({ orderBy: { year: 'desc' } });
    res.json(cycles);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve cycles' } });
  }
});

// Create performance cycle
router.post('/cycles', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, year, phases } = req.body;
    if (!name || !year) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name and year are required' } });
      return;
    }

    // Deactivate all cycles first (only 1 active at a time)
    await prisma.performanceCycle.updateMany({ data: { isActive: false } });

    const cycle = await prisma.performanceCycle.create({
      data: {
        name,
        year: parseInt(year),
        isActive: true,
        phases: JSON.stringify(phases || [
          { phase: 'GOAL_CREATION', startDate: `${year}-05-01`, endDate: `${year}-05-31` },
          { phase: 'Q1', startDate: `${year}-07-01`, endDate: `${year}-09-30` },
          { phase: 'Q2', startDate: `${year}-10-01`, endDate: `${year}-12-31` },
          { phase: 'Q3', startDate: `${parseInt(year) + 1}-01-01`, endDate: `${parseInt(year) + 1}-03-31` },
          { phase: 'Q4', startDate: `${parseInt(year) + 1}-04-01`, endDate: `${parseInt(year) + 1}-04-30` },
        ])
      }
    });
    res.status(201).json(cycle);
  } catch (e: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: e.message || 'Failed to create cycle' } });
  }
});

// Update cycle (set active/inactive)
router.put('/cycles/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isActive, name } = req.body;

    if (isActive) {
      await prisma.performanceCycle.updateMany({ data: { isActive: false } });
    }

    const cycle = await prisma.performanceCycle.update({
      where: { id: String(id) },
      data: { ...(name && { name }), ...(typeof isActive === 'boolean' && { isActive }) }
    });
    res.json(cycle);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update cycle' } });
  }
});

// Delete cycle
router.delete('/cycles/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.performanceCycle.delete({ where: { id: String(id) } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete cycle' } });
  }
});

// ─── Org Hierarchy / Users ────────────────────────────────────────────────────

// Get all users with hierarchy info
router.get('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true, firstName: true, lastName: true, email: true,
        username: true, roles: true, isActive: true, managerId: true,
        manager: { select: { id: true, firstName: true, lastName: true } },
        _count: { select: { directReports: true, goalSheets: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve users' } });
  }
});

// Create user
router.post('/users', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username, email, firstName, lastName, roles, managerId, password } = req.body;
    if (!username || !email || !firstName || !lastName) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'username, email, firstName, lastName are required' } });
      return;
    }
    const passwordHash = await bcrypt.hash(password || 'Password123!', 10);
    const user = await prisma.user.create({
      data: { username, email, passwordHash, firstName, lastName, roles: roles || 'EMPLOYEE', managerId: managerId || null }
    });
    res.status(201).json({ id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, roles: user.roles, email: user.email });
  } catch (e: any) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: e.message || 'Failed to create user' } });
  }
});

// Update user (manager reassignment, role change, activate/deactivate)
router.put('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { firstName, lastName, roles, managerId, isActive } = req.body;

    // Check for circular hierarchy
    if (managerId === id) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User cannot be their own manager' } });
      return;
    }

    const user = await prisma.user.update({
      where: { id: String(id) },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(roles && { roles }),
        ...(managerId !== undefined && { managerId: managerId || null }),
        ...(typeof isActive === 'boolean' && { isActive })
      }
    });
    res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName, roles: user.roles, isActive: user.isActive, managerId: user.managerId });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } });
  }
});

// Archive (soft-delete) user
router.delete('/users/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    await prisma.user.update({ where: { id: String(id) }, data: { isActive: false } });
    res.json({ success: true, message: 'User deactivated' });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate user' } });
  }
});

// ─── Admin Goal Sheet Controls ─────────────────────────────────────────────────

// Get all goal sheets (admin view with filters)
router.get('/goal-sheets', async (req: Request, res: Response): Promise<void> => {
  try {
    const { status, cycleId } = req.query;
    const where: any = {};
    if (status) where.status = status;
    if (cycleId) where.cycleId = String(cycleId);

    const sheets = await prisma.goalSheet.findMany({
      where,
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, email: true } },
        goals: { include: { achievements: { orderBy: { updatedAt: 'desc' }, take: 1 } } },
        cycle: true,
        auditLogs: { orderBy: { timestamp: 'desc' }, take: 5 }
      },
      orderBy: { updatedAt: 'desc' }
    });
    res.json(sheets);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve goal sheets' } });
  }
});

// Admin unlock a goal sheet
router.post('/goal-sheets/:id/unlock', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { adminId, justification } = req.body;

    if (!justification) {
      res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Justification is required for unlocking' } });
      return;
    }

    const sheet = await prisma.$transaction(async (tx) => {
      await tx.auditLog.create({
        data: {
          goalSheetId: String(id), userId: String(adminId), action: 'ADMIN_UNLOCK',
          field: 'status', oldValue: 'APPROVED', newValue: 'DRAFT',
          justification: String(justification)
        }
      });
      return tx.goalSheet.update({ where: { id: String(id) }, data: { status: 'DRAFT', lockDate: null } });
    });

    res.json(sheet);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to unlock goal sheet' } });
  }
});

// ─── Audit Logs ───────────────────────────────────────────────────────────────

router.get('/audit-logs', async (req: Request, res: Response): Promise<void> => {
  try {
    const { employeeId, field, from, to } = req.query;
    const where: any = {};
    if (field) where.field = field;
    if (from || to) where.timestamp = { ...(from && { gte: new Date(from as string) }), ...(to && { lte: new Date(to as string) }) };
    if (employeeId) where.goalSheet = { employeeId };

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        goalSheet: {
          include: { employee: { select: { id: true, firstName: true, lastName: true } } }
        }
      },
      orderBy: { timestamp: 'desc' },
      take: 200
    });
    res.json(logs);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve audit logs' } });
  }
});

// ─── Reports ──────────────────────────────────────────────────────────────────

// Achievement report (admin: org-wide, manager: team-only)
router.get('/reports/achievements', async (req: Request, res: Response): Promise<void> => {
  try {
    const { managerId, employeeId, thrustArea, quarter, cycleId } = req.query;

    let employeeIds: string[] = [];
    if (managerId) {
      const reports = await prisma.user.findMany({ where: { managerId: managerId as string }, select: { id: true } });
      employeeIds = reports.map(r => r.id);
    }

    const goalSheetWhere: any = { status: 'APPROVED' };
    if (cycleId) goalSheetWhere.cycleId = cycleId;
    if (employeeId) goalSheetWhere.employeeId = employeeId;
    else if (employeeIds.length > 0) goalSheetWhere.employeeId = { in: employeeIds };

    const sheets = await prisma.goalSheet.findMany({
      where: goalSheetWhere,
      include: {
        employee: { select: { firstName: true, lastName: true, email: true } },
        cycle: true,
        goals: {
          where: thrustArea ? { thrustArea: thrustArea as string } : {},
          include: {
            achievements: quarter
              ? { where: { quarter: quarter as string }, orderBy: { updatedAt: 'desc' }, take: 1 }
              : { orderBy: { updatedAt: 'desc' }, take: 1 }
          }
        }
      }
    });

    // Flatten to rows
    const rows: any[] = [];
    for (const sheet of sheets) {
      for (const goal of sheet.goals) {
        const latest = goal.achievements[0];
        rows.push({
          employee: `${sheet.employee.firstName} ${sheet.employee.lastName}`,
          email: sheet.employee.email,
          cycle: sheet.cycle.name,
          thrustArea: goal.thrustArea,
          goalTitle: goal.title,
          uom: goal.uom,
          target: goal.target,
          achievement: latest?.actual ?? 'N/A',
          status: latest?.status ?? 'Not Started',
          progressScore: latest?.progressScore ?? 0,
          weightage: goal.weightage,
          quarter: latest?.quarter ?? 'N/A'
        });
      }
    }

    res.json({ rows, generatedAt: new Date().toISOString(), filters: req.query });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } });
  }
});

// Dashboard stats
router.get('/stats', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeCycle = await prisma.performanceCycle.findFirst({ where: { isActive: true } });

    const [totalUsers, totalSheets, pendingSheets, approvedSheets, totalGoals, completedCheckIns] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.goalSheet.count({ where: activeCycle ? { cycleId: activeCycle.id } : {} }),
      prisma.goalSheet.count({ where: { status: 'PENDING_APPROVAL', ...(activeCycle && { cycleId: activeCycle.id }) } }),
      prisma.goalSheet.count({ where: { status: 'APPROVED', ...(activeCycle && { cycleId: activeCycle.id }) } }),
      prisma.goal.count(),
      prisma.checkIn.count({ where: { isCompleted: true } })
    ]);

    const submissionRate = totalUsers > 0 ? Math.round((totalSheets / totalUsers) * 100) : 0;
    const approvalRate = totalSheets > 0 ? Math.round((approvedSheets / totalSheets) * 100) : 0;

    res.json({
      activeCycle,
      totalUsers, totalSheets, pendingSheets, approvedSheets, totalGoals,
      completedCheckIns, submissionRate, approvalRate
    });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve stats' } });
  }
});

// Completion dashboard
router.get('/completion', async (req: Request, res: Response): Promise<void> => {
  try {
    const { cycleId, quarter } = req.query;

    const activeCycle = cycleId
      ? await prisma.performanceCycle.findUnique({ where: { id: cycleId as string } })
      : await prisma.performanceCycle.findFirst({ where: { isActive: true } });

    if (!activeCycle) {
      res.json({ employees: [], cycleId: null });
      return;
    }

    const employees = await prisma.user.findMany({
      where: { roles: 'EMPLOYEE', isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        manager: { select: { firstName: true, lastName: true } },
        goalSheets: {
          where: { cycleId: activeCycle.id, status: 'APPROVED' },
          include: {
            checkIns: quarter ? { where: { quarter: quarter as string } } : true,
            goals: { include: { achievements: { orderBy: { updatedAt: 'desc' }, take: 1 } } }
          }
        }
      }
    });

    const result = employees.map(emp => {
      const sheet = emp.goalSheets[0];
      const checkInDone = sheet?.checkIns?.some((c: any) => c.isCompleted) ?? false;
      const avgProgress = sheet?.goals?.length
        ? sheet.goals.reduce((sum: number, g: any) => sum + (g.achievements[0]?.progressScore || 0) * (g.weightage / 100), 0)
        : 0;

      return {
        id: emp.id,
        name: `${emp.firstName} ${emp.lastName}`,
        manager: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'No Manager',
        hasApprovedSheet: !!sheet,
        checkInCompleted: checkInDone,
        avgProgress: Math.round(avgProgress * 10) / 10
      };
    });

    res.json({ employees: result, cycle: activeCycle });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve completion data' } });
  }
});

// Notifications for a user
router.get('/notifications/:userId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId: String(userId) },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(notifications);
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve notifications' } });
  }
});

// Mark notifications as read
router.put('/notifications/:userId/read-all', async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    await prisma.notification.updateMany({ where: { userId: String(userId), isRead: false }, data: { isRead: true } });
    res.json({ success: true });
  } catch {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notifications read' } });
  }
});

export default router;
