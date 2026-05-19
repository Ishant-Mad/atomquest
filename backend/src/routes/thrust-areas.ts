import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

// Get active thrust areas (for everyone)
router.get('/', async (req: Request, res: Response) => {
  try {
    const thrustAreas = await prisma.thrustArea.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' }
    });
    res.json(thrustAreas);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve thrust areas' } });
  }
});

// Admin routes below

// Get all thrust areas (including inactive)
router.get('/all', async (req: Request, res: Response) => {
  try {
    const thrustAreas = await prisma.thrustArea.findMany({
      orderBy: { createdAt: 'desc' }
    });
    res.json(thrustAreas);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to retrieve thrust areas' } });
  }
});

// Create a new thrust area
router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Name is required' } });

    const existing = await prisma.thrustArea.findUnique({ where: { name } });
    if (existing) return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Thrust area with this name already exists' } });

    const thrustArea = await prisma.thrustArea.create({
      data: { name, description }
    });
    res.status(201).json(thrustArea);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to create thrust area' } });
  }
});

// Update a thrust area
router.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { name, description, isActive } = req.body;
    
    const thrustArea = await prisma.thrustArea.update({
      where: { id },
      data: { name, description, isActive }
    });
    res.json(thrustArea);
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to update thrust area' } });
  }
});

// Delete a thrust area
router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Check if it's in use
    const thrustArea = await prisma.thrustArea.findUnique({ where: { id } });
    if (!thrustArea) return res.status(404).json({ error: { code: 'NOT_FOUND', message: 'Thrust area not found' } });

    const inUse = await prisma.goal.findFirst({ where: { thrustArea: thrustArea.name } });
    if (inUse) {
      return res.status(400).json({ error: { code: 'VALIDATION_ERROR', message: 'Cannot delete thrust area because it is assigned to existing goals.' } });
    }

    await prisma.thrustArea.delete({ where: { id } });
    res.json({ success: true, message: 'Thrust area deleted' });
  } catch (error) {
    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'Failed to delete thrust area' } });
  }
});

export default router;
