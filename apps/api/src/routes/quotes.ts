import { Router } from 'express';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Generate quote number
function generateQuoteNumber(): string {
  const prefix = 'QT';
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}-${timestamp}-${random}`;
}

// Get all quotes
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { search, status, retailerId, page = '1', limit = '20' } = req.query;

    // Filter by retailer for non-admin users
    const effectiveRetailerId =
      req.user!.role === 'RETAILER' ? req.user!.retailerId : (retailerId as string);

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };

    if (effectiveRetailerId) {
      where.retailerId = effectiveRetailerId;
    }

    if (status) {
      where.status = status;
    }

    if (search) {
      where.OR = [
        { quoteNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          retailer: {
            select: { businessName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({
      quotes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

// Get single quote
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: {
        retailer: {
          select: {
            businessName: true,
            contactName: true,
            email: true,
            phone: true,
            markupPercentage: true,
          },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(quote);
  })
);

// Create quote
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      selections,
      calculations,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      notes,
      validUntil,
    } = req.body;

    if (!selections || !calculations || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get retailer ID
    const retailerId =
      req.user!.role === 'RETAILER'
        ? req.user!.retailerId
        : req.body.retailerId;

    if (!retailerId) {
      return res.status(400).json({ error: 'Retailer ID is required' });
    }

    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        retailerId,
        selections,
        calculations,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        notes,
        validUntil: validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
      },
    });

    res.status(201).json(quote);
  })
);

// Update quote
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const {
      selections,
      calculations,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      notes,
      validUntil,
      status,
    } = req.body;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retailers can only update draft quotes
    if (req.user!.role === 'RETAILER' && quote.status !== 'DRAFT' && status !== quote.status) {
      return res.status(400).json({ error: 'Cannot modify sent quote' });
    }

    const updated = await prisma.quote.update({
      where: { id },
      data: {
        ...(selections && { selections }),
        ...(calculations && { calculations }),
        ...(customerName && { customerName }),
        ...(customerEmail !== undefined && { customerEmail }),
        ...(customerPhone !== undefined && { customerPhone }),
        ...(customerAddress !== undefined && { customerAddress }),
        ...(notes !== undefined && { notes }),
        ...(validUntil && { validUntil: new Date(validUntil) }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  })
);

// Delete quote (soft delete)
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Quote deleted successfully' });
  })
);

// Convert quote to order
router.post(
  '/:id/convert',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (quote.status === 'CONVERTED') {
      return res.status(400).json({ error: 'Quote already converted' });
    }

    // Generate order number
    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    // Create order and update quote in transaction
    const result = await prisma.$transaction(async (tx) => {
      const order = await tx.order.create({
        data: {
          orderNumber,
          retailerId: quote.retailerId,
          quoteId: quote.id,
          selections: quote.selections,
          calculations: quote.calculations,
          customerName: quote.customerName,
          customerEmail: quote.customerEmail,
          customerPhone: quote.customerPhone,
          customerAddress: quote.customerAddress,
          totalAmount: quote.calculations?.totalPrice || 0,
          status: 'PENDING',
        },
      });

      await tx.quote.update({
        where: { id: quote.id },
        data: { status: 'CONVERTED' },
      });

      return order;
    });

    res.status(201).json({
      message: 'Quote converted to order successfully',
      order: result,
    });
  })
);

export { router as quotesRouter };
