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
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';
// Register a new user
router.post('/register', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, email, password, firstName, lastName, roles, managerId } = req.body;
        // Hash password
        const passwordHash = yield bcryptjs_1.default.hash(password, 10);
        const user = yield prisma.user.create({
            data: {
                username,
                email,
                passwordHash,
                firstName,
                lastName,
                roles: roles || 'EMPLOYEE',
                managerId: managerId || null
            }
        });
        const token = jsonwebtoken_1.default.sign({ id: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });
        res.status(201).json({ user: { id: user.id, username: user.username, roles: user.roles }, token });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Registration failed' } });
    }
}));
// Login
router.post('/login', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield prisma.user.findUnique({ where: { username } });
        if (!user) {
            res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } });
            return;
        }
        const isValid = yield bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isValid) {
            res.status(401).json({ error: { code: 'AUTH_FAILED', message: 'Invalid credentials' } });
            return;
        }
        const token = jsonwebtoken_1.default.sign({ id: user.id, roles: user.roles }, JWT_SECRET, { expiresIn: '1d' });
        res.json({ user: { id: user.id, username: user.username, roles: user.roles, firstName: user.firstName, lastName: user.lastName }, token });
    }
    catch (error) {
        res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Login failed' } });
    }
}));
exports.default = router;
