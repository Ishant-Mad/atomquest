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
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Create a Shared Goal and push to employees
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { title, description, thrustArea, uom, target, optimizationDirection, primaryOwnerId, createdBy, employeeIds } = req.body;
        // Validate inputs
        if (!title || !thrustArea || !uom || !target || !primaryOwnerId || !createdBy || !employeeIds || !employeeIds.length) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Missing required fields' } });
            return;
        }
        // Since a cycle might not be provided, we'll assume the current active cycle.
        const activeCycle = yield prisma.performanceCycle.findFirst({ where: { isActive: true } });
        if (!activeCycle) {
            res.status(400).json({ error: { code: 'NOT_FOUND', message: 'No active performance cycle found' } });
            return;
        }
        // Validation: Check if any recipient would exceed 8 goals
        const overloadedEmployees = [];
        for (const empId of employeeIds) {
            const sheet = yield prisma.goalSheet.findFirst({
                where: { employeeId: empId, cycleId: activeCycle.id },
                include: { _count: { select: { goals: true } } },
                orderBy: { createdAt: 'desc' }
            });
            if (sheet && sheet._count.goals >= 8) {
                // fetch user to get name for error message
                const user = yield prisma.user.findUnique({ where: { id: empId } });
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
        const result = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // Create the SharedGoal
            const sharedGoal = yield tx.sharedGoal.create({
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
                let sheet = yield tx.goalSheet.findFirst({
                    where: { employeeId: empId, cycleId: activeCycle.id },
                    orderBy: { createdAt: 'desc' }
                });
                if (!sheet) {
                    // Create new draft sheet
                    sheet = yield tx.goalSheet.create({
                        data: {
                            employeeId: empId,
                            cycleId: activeCycle.id,
                            status: 'DRAFT',
                        }
                    });
                }
                // Add the shared goal to their sheet with 0 weightage (they must adjust it later)
                const goal = yield tx.goal.create({
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
        }));
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to create shared goal' } });
    }
}));
// Update achievement for a Shared Goal
router.post('/:id/achievements', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { quarter, actual, status, progressScore, primaryOwnerId } = req.body;
        const sharedGoal = yield prisma.sharedGoal.findUnique({
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
        yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const linkedGoals = sharedGoal.linkedGoals;
            for (const linkedGoal of linkedGoals) {
                // Find existing achievement for this quarter or create new
                const existing = yield tx.achievement.findFirst({
                    where: { goalId: linkedGoal.id, quarter }
                });
                if (existing) {
                    yield tx.achievement.update({
                        where: { id: existing.id },
                        data: { actual, status, progressScore, updatedAt: new Date() }
                    });
                }
                else {
                    yield tx.achievement.create({
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
        }));
        res.json({ success: true, message: 'Achievements synchronized' });
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: error.message || 'Failed to update achievements' } });
    }
}));
exports.default = router;
