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
// Conduct a check-in (Requirement 5)
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { managerId, employeeId, goalSheetId, quarter, feedback } = req.body;
        // Validate quarter enum
        if (!['Q1', 'Q2', 'Q3', 'Q4'].includes(quarter)) {
            res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Invalid quarter' } });
            return;
        }
        const checkIn = yield prisma.checkIn.create({
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
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create check-in' } });
    }
}));
// Get check-in history for an employee
router.get('/employee/:employeeId', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { employeeId } = req.params;
        const checkIns = yield prisma.checkIn.findMany({
            where: { employeeId: String(employeeId) },
            orderBy: { createdAt: 'desc' }
        });
        res.json(checkIns);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve check-ins' } });
    }
}));
exports.default = router;
