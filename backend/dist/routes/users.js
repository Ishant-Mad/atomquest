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
// Get all users (used by checkins, team view, shared goals)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const users = yield prisma.user.findMany({
            where: { isActive: true },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                username: true, roles: true, managerId: true
            },
            orderBy: { firstName: 'asc' }
        });
        res.json(users);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve users' } });
    }
}));
// Get direct reports for a manager (Requirement 8)
router.get('/:id/reports', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const reports = yield prisma.user.findMany({
            where: { managerId: String(id), isActive: true },
            select: {
                id: true, firstName: true, lastName: true, email: true, roles: true,
                goalSheets: {
                    orderBy: { updatedAt: 'desc' },
                    take: 1,
                    select: { id: true, status: true, updatedAt: true }
                }
            }
        });
        res.json(reports);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve direct reports' } });
    }
}));
// Get user profile
router.get('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const user = yield prisma.user.findUnique({
            where: { id: String(id) },
            select: {
                id: true, firstName: true, lastName: true, email: true,
                roles: true, managerId: true,
                manager: { select: { id: true, firstName: true, lastName: true } }
            }
        });
        if (!user) {
            res.status(404).json({ error: { code: 'NOT_FOUND', message: 'User not found' } });
            return;
        }
        res.json(user);
    }
    catch (_a) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve user profile' } });
    }
}));
exports.default = router;
