import { Request, Response } from 'express';
import { prisma } from '@cushion/database';
import { calculateQuote } from '@cushion/calculator-engine';

export class CalculatorController {
  /**
   * Get all calculators
   */
  async getAllCalculators(req: Request, res: Response) {
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
  }

  /**
   * Get single calculator
   */
  async getCalculator(req: Request, res: Response) {
    const { id } = req.params;

    const calculator = await prisma.calculator.findFirst({
      where: { id, deletedAt: null },
    });

    if (!calculator) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    res.json(calculator);
  }

  /**
   * Create calculator
   */
  async createCalculator(req: Request, res: Response) {
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
  }

  /**
   * Update calculator
   */
  async updateCalculator(req: Request, res: Response) {
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
  }

  /**
   * Delete calculator (soft delete)
   */
  async deleteCalculator(req: Request, res: Response) {
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
  }

  /**
   * Calculate quote
   */
  async calculate(req: Request, res: Response) {
    const { selections } = req.body;
    const userRole = (req as any).user?.role;
    const retailerId = (req as any).user?.retailerId;

    if (!selections) {
      return res.status(400).json({ error: 'Selections are required' });
    }

    // Get retailer's markup if applicable
    let markupPercentage = 20; // Default
    if (userRole === 'RETAILER' && retailerId) {
      const retailer = await prisma.retailer.findUnique({
        where: { id: retailerId },
      });
      if (retailer) {
        markupPercentage = retailer.markupPercentage;
      }
    }

    const result = calculateQuote(selections, markupPercentage);

    res.json(result);
  }

  /**
   * Get calculator configuration
   */
  async getConfig(req: Request, res: Response) {
    const { id } = req.params;

    const calculator = await prisma.calculator.findFirst({
      where: { id, deletedAt: null },
      select: {
        id: true,
        name: true,
        productTypes: true,
        shapes: true,
        foamTypes: true,
        fabricTiers: true,
        zipperOptions: true,
        pipingOptions: true,
        tieOptions: true,
        config: true,
      },
    });

    if (!calculator) {
      return res.status(404).json({ error: 'Calculator not found' });
    }

    res.json(calculator);
  }
}

export const calculatorController = new CalculatorController();
