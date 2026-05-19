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
// Get active thrust areas (for everyone)
router.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const thrustAreas = yield prisma.thrustArea.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
        });
        res.json(thrustAreas);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve thrust areas' } });
    }
}));
// Admin routes below
// Get all thrust areas (including inactive)
router.get('/all', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const thrustAreas = yield prisma.thrustArea.findMany({
            orderBy: { createdAt: 'desc' }
        });
        res.json(thrustAreas);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve thrust areas' } });
    }
}));
// Create a new thrust area
router.post('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, description } = req.body;
        if (!name)
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name is required' } });
        const existing = yield prisma.thrustArea.findUnique({ where: { name } });
        if (existing)
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Thrust area with this name already exists' } });
        const thrustArea = yield prisma.thrustArea.create({
            data: { name, description }
        });
        res.status(201).json(thrustArea);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create thrust area' } });
    }
}));
// Update a thrust area
router.put('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        const { name, description, isActive } = req.body;
        const thrustArea = yield prisma.thrustArea.update({
            where: { id },
            data: { name, description, isActive }
        });
        res.json(thrustArea);
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update thrust area' } });
    }
}));
// Delete a thrust area
router.delete('/:id', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.params.id;
        // Check if it's in use
        const thrustArea = yield prisma.thrustArea.findUnique({ where: { id } });
        if (!thrustArea)
            return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Thrust area not found' } });
        const inUse = yield prisma.goal.findFirst({ where: { thrustArea: thrustArea.name } });
        if (inUse) {
            return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cannot delete thrust area because it is assigned to existing goals.' } });
        }
        yield prisma.thrustArea.delete({ where: { id } });
        res.json({ success: true, message: 'Thrust area deleted' });
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete thrust area' } });
    }
}));
exports.default = router;
