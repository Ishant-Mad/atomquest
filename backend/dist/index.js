"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const goals_1 = __importDefault(require("./routes/goals"));
const users_1 = __importDefault(require("./routes/users"));
const checkins_1 = __importDefault(require("./routes/checkins"));
const achievements_1 = __importDefault(require("./routes/achievements"));
const auth_1 = __importDefault(require("./routes/auth"));
const shared_goals_1 = __importDefault(require("./routes/shared-goals"));
const thrust_areas_1 = __importDefault(require("./routes/thrust-areas"));
const admin_1 = __importDefault(require("./routes/admin"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 5000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.use('/api/auth', auth_1.default);
app.use('/api/goal-sheets', goals_1.default);
app.use('/api/hierarchy/employees', users_1.default);
app.use('/api/users', users_1.default);
app.use('/api/check-ins', checkins_1.default);
app.use('/api/achievements', achievements_1.default);
app.use('/api/shared-goals', shared_goals_1.default);
app.use('/api/thrust-areas', thrust_areas_1.default);
app.use('/api/admin', admin_1.default);
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Goal Setting API is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: { code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' } });
});
process.on('uncaughtException', (err) => console.error('UNCAUGHT:', err));
process.on('unhandledRejection', (err) => console.error('UNHANDLED:', err));
const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
server.on('error', (err) => {
    console.error('Express Server Error:', err);
});
