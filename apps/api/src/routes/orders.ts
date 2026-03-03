import { Router } from 'express';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all orders
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
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
        { customerName: { contains: search as string, mode: 'insensitive' } },
        { customerEmail: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          retailer: {
            select: { businessName: true },
          },
          quote: {
            select: { quoteNumber: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.order.count({ where }),
    ]);

    res.json({
      orders,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

// Get single order
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
      include: {
        retailer: {
          select: {
            businessName: true,
            contactName: true,
            email: true,
            phone: true,
          },
        },
        quote: true,
      },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== order.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(order);
  })
);

// Create order (Super Admin only - manual order creation)
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      retailerId,
      selections,
      calculations,
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      notes,
    } = req.body;

    if (!retailerId || !selections || !calculations || !customerName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}-${Math.random()
      .toString(36)
      .substring(2, 5)
      .toUpperCase()}`;

    const order = await prisma.order.create({
      data: {
        orderNumber,
        retailerId,
        selections,
        calculations,
        customerName,
        customerEmail,
        customerPhone,
        customerAddress,
        notes,
        totalAmount: calculations.totalPrice || 0,
        status: 'PENDING',
      },
    });

    res.status(201).json(order);
  })
);

// Update order status
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { status, notes, trackingNumber } = req.body;

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== order.retailerId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retailers have limited status update permissions
    if (req.user!.role === 'RETAILER') {
      const allowedStatuses = ['CANCELLED'];
      if (status && !allowedStatuses.includes(status)) {
        return res.status(403).json({ error: 'Cannot update to this status' });
      }
    }

    const updated = await prisma.order.update({
      where: { id },
      data: {
        ...(status && { status }),
        ...(notes !== undefined && { notes }),
        ...(trackingNumber !== undefined && { trackingNumber }),
      },
    });

    res.json(updated);
  })
);

// Delete order (Super Admin only - soft delete)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const order = await prisma.order.findFirst({
      where: { id, deletedAt: null },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await prisma.order.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Order deleted successfully' });
  })
);

// Get order statistics
router.get(
  '/stats/overview',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const [statusCounts, totalRevenue, recentOrders] = await Promise.all([
      prisma.order.groupBy({
        by: ['status'],
        where: { deletedAt: null },
        _count: true,
      }),
      prisma.order.aggregate({
        where: { deletedAt: null, status: { not: 'CANCELLED' } },
        _sum: { totalAmount: true },
      }),
      prisma.order.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          retailer: { select: { businessName: true } },
        },
      }),
    ]);

    res.json({
      statusCounts,
      totalRevenue: totalRevenue._sum.totalAmount || 0,
      recentOrders,
    });
  })
);

export { router as ordersRouter };
