import { Router } from 'express';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all calculators
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { active, search } = req.query;

    const where: any = { deletedAt: null };

    if (active !== undefined) {
      where.isActive = active === 'true';
    }

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const calculators = await prisma.calculator.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json(calculators);
  })
);

// Get single calculator
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const calculator = await prisma.calculator.findFirst({
      where: { id, deletedAt: null },
    });

    if (!calculator) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    res.json(calculator);
  })
);

// Create calculator (Super Admin only)
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      name,
      description,
      productTypes,
      shapes,
      foamTypes,
      fabricTiers,
      zipperOptions,
      pipingOptions,
      tieOptions,
      config,
    } = req.body;

    if (!name || !productTypes || !shapes) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const calculator = await prisma.calculator.create({
      data: {
        name,
        description,
        productTypes,
        shapes,
        foamTypes: foamTypes || {},
        fabricTiers: fabricTiers || {},
        zipperOptions: zipperOptions || {},
        pipingOptions: pipingOptions || {},
        tieOptions: tieOptions || {},
        config: config || {},
        isActive: true,
      },
    });

    res.status(201).json(calculator);
  })
);

// Update calculator (Super Admin only)
router.patch(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const {
      name,
      description,
      productTypes,
      shapes,
      foamTypes,
      fabricTiers,
      zipperOptions,
      pipingOptions,
      tieOptions,
      config,
      isActive,
    } = req.body;

    const calculator = await prisma.calculator.findFirst({
      where: { id, deletedAt: null },
    });

    if (!calculator) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    const updated = await prisma.calculator.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(productTypes && { productTypes }),
        ...(shapes && { shapes }),
        ...(foamTypes && { foamTypes }),
        ...(fabricTiers && { fabricTiers }),
        ...(zipperOptions && { zipperOptions }),
        ...(pipingOptions && { pipingOptions }),
        ...(tieOptions && { tieOptions }),
        ...(config && { config }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    res.json(updated);
  })
);

// Delete calculator (Super Admin only - soft delete)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const calculator = await prisma.calculator.findFirst({
      where: { id, deletedAt: null },
    });

    if (!calculator) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    await prisma.calculator.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Calculator deleted successfully' });
  })
);

// Calculate quote
router.post(
  '/calculate',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { selections } = req.body;

    if (!selections) {
      return res.status(400).json({ error: 'Selections are required' });
    }

    // Get retailer's markup if applicable
    let markupPercentage = 20; // Default
    if (req.user!.role === 'RETAILER' && req.user!.retailerId) {
      const retailer = await prisma.retailer.findUnique({
        where: { id: req.user!.retailerId },
      });
      if (retailer) {
        markupPercentage = retailer.markupPercentage;
      }
    }

    // Import calculator engine
    const { calculateQuote } = await import('@cushion/calculator-engine');

    const result = calculateQuote(selections, markupPercentage);

    res.json(result);
  })
);

export { router as calculatorsRouter };
