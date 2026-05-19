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
// Get goal sheets by employee (Requirement 2 & 13)
router.get('/employee/:employeeId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const goalSheets = yield prisma.goalSheet.findMany({
            where: { employeeId: String(employeeId) },
            include: {
                goals: {
                    include: { achievements: true }
                },
                cycle: true
            }
        });
        res.json(goalSheets);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve goal sheets' } });
    }
}));
// Create new goal sheet (Requirement 1)
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId, cycleId, goals } = req.body;
        // In demo mode: bypass May-only restriction
        const isDemoMode = process.env.DEMO_MODE !== 'false';
        // Weightage validation
        const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
        if (totalWeightage !== 100) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Total weightage must equal 100%' } });
            return;
        }
        const minWeightageValid = goals.every((g) => g.weightage >= 10);
        if (!minWeightageValid) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Each goal must have at least 10% weightage' } });
            return;
        }
        // Checking max goals
        if (goals.length < 1 || goals.length > 8) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Goal sheet must have between 1 and 8 goals' } });
            return;
        }
        const newSheet = yield prisma.goalSheet.create({
            data: {
                employeeId,
                cycleId,
                status: 'DRAFT',
                goals: {
                    create: goals.map((g) => ({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create goal sheet' } });
    }
}));
// Submit goal sheet for approval
router.post('/:id/submit', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // In demo mode: bypass May-only restriction
        const sheet = yield prisma.goalSheet.update({
            where: { id: String(id) },
            data: {
                status: 'PENDING_APPROVAL',
                submittedAt: new Date(),
            }
        });
        // TODO: Create Notification constraint triggers
        res.json(sheet);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to submit goal sheet' } });
    }
}));
// Edit an existing goal sheet
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { goals } = req.body;
        // In demo mode: bypass May-only restriction
        // Weightage validation
        const totalWeightage = goals.reduce((sum, g) => sum + g.weightage, 0);
        if (totalWeightage !== 100) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Total weightage must equal 100%' } });
            return;
        }
        const minWeightageValid = goals.every((g) => g.weightage >= 10);
        if (!minWeightageValid) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Each goal must have at least 10% weightage' } });
            return;
        }
        if (goals.length < 1 || goals.length > 8) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Goal sheet must have between 1 and 8 goals' } });
            return;
        }
        // Update goal sheet and its goals within a transaction
        const updatedSheet = yield prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            // To properly handle shared goals, we should update existing and create new
            const existingGoals = yield tx.goal.findMany({ where: { goalSheetId: String(id) } });
            const incomingIds = goals.map((g) => g.id).filter(Boolean);
            // Delete goals that are removed
            yield tx.goal.deleteMany({
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
                    if ((existing === null || existing === void 0 ? void 0 : existing.isShared) && !existing.isPrimaryOwner) {
                        // Can only update weightage for shared goals
                        yield tx.goal.update({
                            where: { id: g.id },
                            data: { weightage: g.weightage }
                        });
                    }
                    else {
                        yield tx.goal.update({
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
                }
                else {
                    yield tx.goal.create({
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
        }));
        res.json(updatedSheet);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update goal sheet' } });
    }
}));
// Approve goal sheet
router.post('/:id/approve', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { managerId } = req.body; // In real app, comes from JWT
        // In demo mode: bypass July approval cutoff
        const sheet = yield prisma.goalSheet.update({
            where: { id: String(id) },
            data: {
                status: 'APPROVED',
                approvedById: managerId,
                approvedAt: new Date(),
                lockDate: new Date()
            }
        });
        res.json(sheet);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to approve goal sheet' } });
    }
}));
// Return goal sheet for rework
router.post('/:id/return', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // In demo mode: bypass July approval cutoff
        // In real app, we'd add manager comments to the payload
        const sheet = yield prisma.goalSheet.update({
            where: { id: String(id) },
            data: {
                status: 'RETURNED'
            }
        });
        res.json(sheet);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to return goal sheet' } });
    }
}));
// Get pending goal sheets for a manager
router.get('/pending/:managerId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { managerId } = req.params;
        // Find all employees reporting to this manager
        const employees = yield prisma.user.findMany({
            where: { managerId: String(managerId) },
            select: { id: true }
        });
        const employeeIds = employees.map(e => e.id);
        // Find all pending goal sheets for these employees
        const goalSheets = yield prisma.goalSheet.findMany({
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
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve pending goal sheets' } });
    }
}));
exports.default = router;
