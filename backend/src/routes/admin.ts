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

// ─── Analytics ─────────────────────────────────────────────────────────────────

router.get('/analytics', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeCycle = await prisma.performanceCycle.findFirst({ where: { isActive: true } });
    const cycleId = activeCycle?.id;

    // 1. Goal distribution by Thrust Area
    const allGoals = await prisma.goal.findMany({
      where: cycleId ? { goalSheet: { cycleId } } : {},
      select: { thrustArea: true, uom: true, weightage: true, achievements: { orderBy: { updatedAt: 'desc' }, take: 1 } }
    });

    const thrustAreaDist: Record<string, number> = {};
    const uomDist: Record<string, number> = {};
    for (const g of allGoals) {
      thrustAreaDist[g.thrustArea] = (thrustAreaDist[g.thrustArea] || 0) + 1;
      uomDist[g.uom] = (uomDist[g.uom] || 0) + 1;
    }

    // 2. Goal sheet status distribution
    const statusCounts = await prisma.goalSheet.groupBy({
      by: ['status'],
      where: cycleId ? { cycleId } : {},
      _count: true,
    });
    const statusDist = statusCounts.map(s => ({ status: s.status, count: s._count }));

    // 3. QoQ achievement trends — average progress per quarter
    const achievements = await prisma.achievement.findMany({
      where: cycleId ? { goal: { goalSheet: { cycleId } } } : {},
      select: { quarter: true, progressScore: true }
    });

    const qoqMap: Record<string, { total: number; count: number }> = {};
    for (const a of achievements) {
      if (!qoqMap[a.quarter]) qoqMap[a.quarter] = { total: 0, count: 0 };
      qoqMap[a.quarter].total += a.progressScore;
      qoqMap[a.quarter].count += 1;
    }
    const qoqTrends = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => ({
      quarter: q,
      avgScore: qoqMap[q] ? Math.round((qoqMap[q].total / qoqMap[q].count) * 10) / 10 : 0,
      goalCount: qoqMap[q]?.count || 0
    }));

    // 4. Manager effectiveness — check-in completion rates per manager
    const managers = await prisma.user.findMany({
      where: { roles: 'MANAGER', isActive: true },
      select: {
        id: true, firstName: true, lastName: true,
        directReports: {
          where: { isActive: true },
          select: {
            id: true,
            goalSheets: {
              where: cycleId ? { cycleId, status: 'APPROVED' } : { status: 'APPROVED' },
              select: {
                checkIns: { select: { quarter: true, isCompleted: true } }
              }
            }
          }
        }
      }
    });

    const managerEffectiveness = managers.map(m => {
      const totalReports = m.directReports.length;
      const totalCheckIns = m.directReports.reduce((sum, r) => {
        return sum + r.goalSheets.reduce((gSum, gs) => gSum + gs.checkIns.filter(c => c.isCompleted).length, 0);
      }, 0);
      const expectedCheckIns = totalReports * 4; // 4 quarters
      return {
        id: m.id,
        name: `${m.firstName} ${m.lastName}`,
        directReports: totalReports,
        completedCheckIns: totalCheckIns,
        completionRate: expectedCheckIns > 0 ? Math.round((totalCheckIns / expectedCheckIns) * 100) : 0
      };
    });

    // 5. Dept-level heatmap data (by manager team × quarter)
    const heatmapData = managers.map(m => {
      const quarters = ['Q1', 'Q2', 'Q3', 'Q4'].map(q => {
        let totalScore = 0, count = 0;
        for (const r of m.directReports) {
          for (const gs of r.goalSheets) {
            const checkIn = gs.checkIns.find(c => c.quarter === q && c.isCompleted);
            if (checkIn) count++;
          }
        }
        return { quarter: q, completions: count, total: m.directReports.length };
      });
      return { manager: `${m.firstName} ${m.lastName}`, quarters };
    });

    res.json({
      thrustAreaDistribution: Object.entries(thrustAreaDist).map(([name, count]) => ({ name, count })),
      uomDistribution: Object.entries(uomDist).map(([name, count]) => ({ name, count })),
      statusDistribution: statusDist,
      qoqTrends,
      managerEffectiveness,
      heatmapData,
      totalGoals: allGoals.length,
      cycle: activeCycle
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate analytics' } });
  }
});

// ─── Escalation Rules ──────────────────────────────────────────────────────────

// Get escalation status (simulated rule evaluation)
router.get('/escalations', async (req: Request, res: Response): Promise<void> => {
  try {
    const activeCycle = await prisma.performanceCycle.findFirst({ where: { isActive: true } });
    if (!activeCycle) { res.json({ rules: [], violations: [] }); return; }

    const cycleStart = new Date(JSON.parse(activeCycle.phases)[0]?.startDate || activeCycle.createdAt);
    const now = new Date();
    const daysSinceCycleOpen = Math.floor((now.getTime() - cycleStart.getTime()) / (1000 * 60 * 60 * 24));

    // Find employees who haven't submitted
    const allEmployees = await prisma.user.findMany({
      where: { roles: 'EMPLOYEE', isActive: true },
      select: {
        id: true, firstName: true, lastName: true, email: true,
        managerId: true,
        manager: { select: { firstName: true, lastName: true } },
        goalSheets: {
          where: { cycleId: activeCycle.id },
          select: { id: true, status: true, submittedAt: true, approvedAt: true }
        }
      }
    });

    const violations: any[] = [];

    for (const emp of allEmployees) {
      const sheet = emp.goalSheets[0];
      
      // Rule 1: No submission within 14 days of cycle open
      if (!sheet || sheet.status === 'DRAFT') {
        if (daysSinceCycleOpen > 14) {
          violations.push({
            type: 'NO_SUBMISSION',
            severity: daysSinceCycleOpen > 30 ? 'HIGH' : 'MEDIUM',
            employee: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.id,
            manager: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'No Manager',
            message: `Has not submitted goals (${daysSinceCycleOpen} days since cycle opened)`,
            daysOverdue: daysSinceCycleOpen - 14
          });
        }
      }

      // Rule 2: Pending approval for more than 7 days
      if (sheet?.status === 'PENDING_APPROVAL' && sheet.submittedAt) {
        const daysPending = Math.floor((now.getTime() - new Date(sheet.submittedAt).getTime()) / (1000 * 60 * 60 * 24));
        if (daysPending > 7) {
          violations.push({
            type: 'APPROVAL_DELAYED',
            severity: daysPending > 14 ? 'HIGH' : 'MEDIUM',
            employee: `${emp.firstName} ${emp.lastName}`,
            employeeId: emp.id,
            manager: emp.manager ? `${emp.manager.firstName} ${emp.manager.lastName}` : 'No Manager',
            message: `Goal sheet pending manager approval for ${daysPending} days`,
            daysOverdue: daysPending - 7
          });
        }
      }
    }

    // Rule 3: Check-in not completed (check quarterly windows)
    const approvedSheets = await prisma.goalSheet.findMany({
      where: { cycleId: activeCycle.id, status: 'APPROVED' },
      include: {
        employee: { select: { id: true, firstName: true, lastName: true, manager: { select: { firstName: true, lastName: true } } } },
        checkIns: true
      }
    });

    const phases = JSON.parse(activeCycle.phases);
    for (const phase of phases) {
      if (['Q1', 'Q2', 'Q3', 'Q4'].includes(phase.phase)) {
        const phaseEnd = new Date(phase.endDate);
        if (now > phaseEnd) {
          // This quarter has passed — check if check-ins were done
          for (const sheet of approvedSheets) {
            const hasCheckIn = sheet.checkIns.some((c: any) => c.quarter === phase.phase && c.isCompleted);
            if (!hasCheckIn) {
              violations.push({
                type: 'CHECKIN_MISSED',
                severity: 'MEDIUM',
                employee: `${sheet.employee.firstName} ${sheet.employee.lastName}`,
                employeeId: sheet.employee.id,
                manager: sheet.employee.manager ? `${sheet.employee.manager.firstName} ${sheet.employee.manager.lastName}` : 'No Manager',
                message: `${phase.phase} check-in not completed (window closed ${phaseEnd.toLocaleDateString()})`,
                daysOverdue: Math.floor((now.getTime() - phaseEnd.getTime()) / (1000 * 60 * 60 * 24))
              });
            }
          }
        }
      }
    }

    const rules = [
      { id: 'NO_SUBMISSION', name: 'Goal Submission Deadline', description: 'Employee has not submitted goals within 14 days of cycle opening', escalationChain: 'Employee → Manager → HR', threshold: '14 days' },
      { id: 'APPROVAL_DELAYED', name: 'Manager Approval SLA', description: 'Manager has not approved goals within 7 days of submission', escalationChain: 'Manager → Skip-level → HR', threshold: '7 days' },
      { id: 'CHECKIN_MISSED', name: 'Quarterly Check-in Window', description: 'Quarterly check-in not completed before window closes', escalationChain: 'Employee → Manager → HR', threshold: 'End of quarter' },
    ];

    res.json({
      rules,
      violations: violations.sort((a, b) => b.daysOverdue - a.daysOverdue),
      summary: {
        total: violations.length,
        high: violations.filter(v => v.severity === 'HIGH').length,
        medium: violations.filter(v => v.severity === 'MEDIUM').length,
      },
      cycle: activeCycle
    });
  } catch (e: any) {
    console.error(e);
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to evaluate escalations' } });
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
