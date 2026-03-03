import { Request, Response } from 'express';
import { prisma } from '@cushion/database';

export class QuoteController {
  /**
   * Get all quotes
   */
  async getAllQuotes(req: Request, res: Response) {
    const { search, status, retailerId, page = '1', limit = '20' } = req.query;

    // Filter by retailer for non-admin users
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;
    const effectiveRetailerId =
      userRole === 'RETAILER' ? userRetailerId : (retailerId as string);

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
  }

  /**
   * Get single quote
   */
  async getQuote(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

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
    if (userRole === 'RETAILER' && userRetailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(quote);
  }

  /**
   * Create quote
   */
  async createQuote(req: Request, res: Response) {
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

    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    if (!selections || !calculations || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Get retailer ID
    const retailerId =
      userRole === 'RETAILER' ? userRetailerId : req.body.retailerId;

    if (!retailerId) {
      return res.status(400).json({ error: 'Retailer ID is required' });
    }

    // Generate quote number
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        retailerId,
        selections,
        calculations,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        notes,
        validUntil: validUntil
          ? new Date(validUntil)
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        status: 'DRAFT',
      },
    });

    res.status(201).json(quote);
  }

  /**
   * Update quote
   */
  async updateQuote(req: Request, res: Response) {
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

    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retailers can only update draft quotes
    if (userRole === 'RETAILER' && quote.status !== 'DRAFT' && status !== quote.status) {
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
  }

  /**
   * Delete quote (soft delete)
   */
  async deleteQuote(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.quote.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Quote deleted successfully' });
  }

  /**
   * Convert quote to order
   */
  async convertToOrder(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== quote.retailerId) {
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
  }

  /**
   * Send quote to customer
   */
  async sendQuote(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    const quote = await prisma.quote.findFirst({
      where: { id, deletedAt: null },
      include: {
        retailer: {
          select: { businessName: true },
        },
      },
    });

    if (!quote) {
      return res.status(404).json({ error: 'Quote not found' });
    }

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== quote.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (!quote.customerEmail) {
      return res.status(400).json({ error: 'Quote has no customer email' });
    }

    // Update quote status
    const updated = await prisma.quote.update({
      where: { id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    // TODO: Generate and send PDF email

    res.json({
      message: 'Quote sent successfully',
      quote: updated,
    });
  }
}

export const quoteController = new QuoteController();
