"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// ─── Performance Cycles ───────────────────────────────────────────────────────
// Get all performance cycles
router.get('/cycles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const cycles = yield prisma.performanceCycle.findMany({ orderBy: { year: 'desc' } });
        res.json(cycles);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve cycles' } });
    }
}));
// Create performance cycle
router.post('/cycles', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, year, phases } = req.body;
        if (!name || !year) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name and year are required' } });
            return;
        }
        // Deactivate all cycles first (only 1 active at a time)
        yield prisma.performanceCycle.updateMany({ data: { isActive: false } });
        const cycle = yield prisma.performanceCycle.create({
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
    }
    catch (e) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: e.message || 'Failed to create cycle' } });
    }
}));
// Update cycle (set active/inactive)
router.put('/cycles/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { isActive, name } = req.body;
        if (isActive) {
            yield prisma.performanceCycle.updateMany({ data: { isActive: false } });
        }
        const cycle = yield prisma.performanceCycle.update({
            where: { id: String(id) },
            data: Object.assign(Object.assign({}, (name && { name })), (typeof isActive === 'boolean' && { isActive }))
        });
        res.json(cycle);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update cycle' } });
    }
}));
// Delete cycle
router.delete('/cycles/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.performanceCycle.delete({ where: { id: String(id) } });
        res.json({ success: true });
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete cycle' } });
    }
}));
// ─── Org Hierarchy / Users ────────────────────────────────────────────────────
// Get all users with hierarchy info
router.get('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            select: {
                id: true, firstName: true, lastName: true, email: true,
                username: true, roles: true, isActive: true, managerId: true,
                manager: { select: { id: true, firstName: true, lastName: true } },
                _count: { select: { directReports: true, goalSheets: true } }
            },
            orderBy: { createdAt: 'asc' }
        });
        res.json(users);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve users' } });
    }
}));
// Create user
router.post('/users', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, firstName, lastName, roles, managerId, password } = req.body;
        if (!username || !email || !firstName || !lastName) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'username, email, firstName, lastName are required' } });
            return;
        }
        const passwordHash = yield bcryptjs_1.default.hash(password || 'Password123!', 10);
        const user = yield prisma.user.create({
            data: { username, email, passwordHash, firstName, lastName, roles: roles || 'EMPLOYEE', managerId: managerId || null }
        });
        res.status(201).json({ id: user.id, username: user.username, firstName: user.firstName, lastName: user.lastName, roles: user.roles, email: user.email });
    }
    catch (e) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: e.message || 'Failed to create user' } });
    }
}));
// Update user (manager reassignment, role change, activate/deactivate)
router.put('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { firstName, lastName, roles, managerId, isActive } = req.body;
        // Check for circular hierarchy
        if (managerId === id) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'User cannot be their own manager' } });
            return;
        }
        const user = yield prisma.user.update({
            where: { id: String(id) },
            data: Object.assign(Object.assign(Object.assign(Object.assign(Object.assign({}, (firstName && { firstName })), (lastName && { lastName })), (roles && { roles })), (managerId !== undefined && { managerId: managerId || null })), (typeof isActive === 'boolean' && { isActive }))
        });
        res.json({ id: user.id, firstName: user.firstName, lastName: user.lastName, roles: user.roles, isActive: user.isActive, managerId: user.managerId });
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update user' } });
    }
}));
// Archive (soft-delete) user
router.delete('/users/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield prisma.user.update({ where: { id: String(id) }, data: { isActive: false } });
        res.json({ success: true, message: 'User deactivated' });
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to deactivate user' } });
    }
}));
// ─── Admin Goal Sheet Controls ─────────────────────────────────────────────────
// Get all goal sheets (admin view with filters)
router.get('/goal-sheets', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { status, cycleId } = req.query;
        const where = {};
        if (status)
            where.status = status;
        if (cycleId)
            where.cycleId = String(cycleId);
        const sheets = yield prisma.goalSheet.findMany({
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
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve goal sheets' } });
    }
}));
// Admin unlock a goal sheet
router.post('/goal-sheets/:id/unlock', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { adminId, justification } = req.body;
        if (!justification) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Justification is required for unlocking' } });
            return;
        }
        const sheet = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            yield tx.auditLog.create({
                data: {
                    goalSheetId: String(id), userId: String(adminId), action: 'ADMIN_UNLOCK',
                    field: 'status', oldValue: 'APPROVED', newValue: 'DRAFT',
                    justification: String(justification)
                }
            });
            return tx.goalSheet.update({ where: { id: String(id) }, data: { status: 'DRAFT', lockDate: null } });
        }));
        res.json(sheet);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to unlock goal sheet' } });
    }
}));
// ─── Audit Logs ───────────────────────────────────────────────────────────────
router.get('/audit-logs', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId, field, from, to } = req.query;
        const where = {};
        if (field)
            where.field = field;
        if (from || to)
            where.timestamp = Object.assign(Object.assign({}, (from && { gte: new Date(from) })), (to && { lte: new Date(to) }));
        if (employeeId)
            where.goalSheet = { employeeId };
        const logs = yield prisma.auditLog.findMany({
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
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve audit logs' } });
    }
}));
// ─── Reports ──────────────────────────────────────────────────────────────────
// Achievement report (admin: org-wide, manager: team-only)
router.get('/reports/achievements', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b, _c, _d;
    try {
        const { managerId, employeeId, thrustArea, quarter, cycleId } = req.query;
        let employeeIds = [];
        if (managerId) {
            const reports = yield prisma.user.findMany({ where: { managerId: managerId }, select: { id: true } });
            employeeIds = reports.map(r => r.id);
        }
        const goalSheetWhere = { status: 'APPROVED' };
        if (cycleId)
            goalSheetWhere.cycleId = cycleId;
        if (employeeId)
            goalSheetWhere.employeeId = employeeId;
        else if (employeeIds.length > 0)
            goalSheetWhere.employeeId = { in: employeeIds };
        const sheets = yield prisma.goalSheet.findMany({
            where: goalSheetWhere,
            include: {
                employee: { select: { firstName: true, lastName: true, email: true } },
                cycle: true,
                goals: {
                    where: thrustArea ? { thrustArea: thrustArea } : {},
                    include: {
                        achievements: quarter
                            ? { where: { quarter: quarter }, orderBy: { updatedAt: 'desc' }, take: 1 }
                            : { orderBy: { updatedAt: 'desc' }, take: 1 }
                    }
                }
            }
        });
        // Flatten to rows
        const rows = [];
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
                    achievement: (_a = latest === null || latest === void 0 ? void 0 : latest.actual) !== null && _a !== void 0 ? _a : 'N/A',
                    status: (_b = latest === null || latest === void 0 ? void 0 : latest.status) !== null && _b !== void 0 ? _b : 'Not Started',
                    progressScore: (_c = latest === null || latest === void 0 ? void 0 : latest.progressScore) !== null && _c !== void 0 ? _c : 0,
                    weightage: goal.weightage,
                    quarter: (_d = latest === null || latest === void 0 ? void 0 : latest.quarter) !== null && _d !== void 0 ? _d : 'N/A'
                });
            }
        }
        res.json({ rows, generatedAt: new Date().toISOString(), filters: req.query });
    }
    catch (_e) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to generate report' } });
    }
}));
// Dashboard stats
router.get('/stats', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const activeCycle = yield prisma.performanceCycle.findFirst({ where: { isActive: true } });
        const [totalUsers, totalSheets, pendingSheets, approvedSheets, totalGoals, completedCheckIns] = yield Promise.all([
            prisma.user.count({ where: { isActive: true } }),
            prisma.goalSheet.count({ where: activeCycle ? { cycleId: activeCycle.id } : {} }),
            prisma.goalSheet.count({ where: Object.assign({ status: 'PENDING_APPROVAL' }, (activeCycle && { cycleId: activeCycle.id })) }),
            prisma.goalSheet.count({ where: Object.assign({ status: 'APPROVED' }, (activeCycle && { cycleId: activeCycle.id })) }),
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
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve stats' } });
    }
}));
// Completion dashboard
router.get('/completion', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { cycleId, quarter } = req.query;
        const activeCycle = cycleId
            ? yield prisma.performanceCycle.findUnique({ where: { id: cycleId } })
            : yield prisma.performanceCycle.findFirst({ where: { isActive: true } });
        if (!activeCycle) {
            res.json({ employees: [], cycleId: null });
            return;
        }
        const employees = yield prisma.user.findMany({
            where: { roles: 'EMPLOYEE', isActive: true },
            select: {
                id: true, firstName: true, lastName: true,
                manager: { select: { firstName: true, lastName: true } },
                goalSheets: {
                    where: { cycleId: activeCycle.id, status: 'APPROVED' },
                    include: {
                        checkIns: quarter ? { where: { quarter: quarter } } : true,
                        goals: { include: { achievements: { orderBy: { updatedAt: 'desc' }, take: 1 } } }
                    }
                }
            }
        });
        const result = employees.map(emp => {
            var _a, _b, _c;
            const sheet = emp.goalSheets[0];
            const checkInDone = (_b = (_a = sheet === null || sheet === void 0 ? void 0 : sheet.checkIns) === null || _a === void 0 ? void 0 : _a.some((c) => c.isCompleted)) !== null && _b !== void 0 ? _b : false;
            const avgProgress = ((_c = sheet === null || sheet === void 0 ? void 0 : sheet.goals) === null || _c === void 0 ? void 0 : _c.length)
                ? sheet.goals.reduce((sum, g) => { var _a; return sum + (((_a = g.achievements[0]) === null || _a === void 0 ? void 0 : _a.progressScore) || 0) * (g.weightage / 100); }, 0)
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
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve completion data' } });
    }
}));
// Notifications for a user
router.get('/notifications/:userId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        const notifications = yield prisma.notification.findMany({
            where: { userId: String(userId) },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
        res.json(notifications);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve notifications' } });
    }
}));
// Mark notifications as read
router.put('/notifications/:userId/read-all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { userId } = req.params;
        yield prisma.notification.updateMany({ where: { userId: String(userId), isRead: false }, data: { isRead: true } });
        res.json({ success: true });
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to mark notifications read' } });
    }
}));
exports.default = router;
