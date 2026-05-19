import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import goalRoutes from './routes/goals';
import userRoutes from './routes/users';
import checkInRoutes from './routes/checkins';
import achievementRoutes from './routes/achievements';
import authRoutes from './routes/auth';
import sharedGoalRoutes from './routes/shared-goals';
import thrustAreaRoutes from './routes/thrust-areas';
import adminRoutes from './routes/admin';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/goal-sheets', goalRoutes);
app.use('/api/hierarchy/employees', userRoutes);
app.use('/api/users', userRoutes);
app.use('/api/check-ins', checkInRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/shared-goals', sharedGoalRoutes);
app.use('/api/thrust-areas', thrustAreaRoutes);
app.use('/api/admin', adminRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Goal Setting API is running' });
});

// Error handling middleware
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
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
