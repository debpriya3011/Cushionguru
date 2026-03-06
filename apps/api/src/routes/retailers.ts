import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';

const router = Router();

// Get all retailers (Super Admin only)
router.get(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req, res) => {
    const { search, status, page = '1', limit = '20' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };

    if (search) {
      where.OR = [
        { businessName: { contains: search as string, mode: 'insensitive' } },
        { contactName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (status) {
      where.status = status;
    }

    const [retailers, total] = await Promise.all([
      prisma.retailer.findMany({
        where,
        include: {
          users: {
            where: { deletedAt: null },
            select: { id: true, name: true, email: true, lastLoginAt: true },
          },
          _count: {
            select: {
              quotes: true,
              orders: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.retailer.count({ where }),
    ]);

    res.json({
      retailers,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

// Get single retailer
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const retailer = await prisma.retailer.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
          select: {
            id: true,
            name: true,
            email: true,
            lastLoginAt: true,
            createdAt: true,
          },
        },
        quotes: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            quoteNumber: true,
            customerName: true,
            totalPrice: true,
            status: true,
            createdAt: true,
          },
        },
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            orderNumber: true,
            customerName: true,
            totalAmount: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!retailer) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    res.json(retailer);
  })
);

// Create retailer (Super Admin only)
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      markupPercentage,
      adminEmail,
      adminName,
      adminPassword,
    } = req.body;

    // Validate required fields
    if (!businessName || !contactName || !email || !adminEmail || !adminName) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check retailer limit
    const retailerCount = await prisma.retailer.count({
      where: { deletedAt: null },
    });

    if (retailerCount >= 30) {
      return res.status(400).json({ error: 'Maximum retailer limit reached (30)' });
    }

    // Create retailer and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      const retailer = await tx.retailer.create({
        data: {
          businessName,
          contactName,
          email: email.toLowerCase(),
          phone,
          address,
          markupPercentage: markupPercentage || 20,
          status: 'ACTIVE',
        },
      });

      const hashedPassword = adminPassword
        ? await bcrypt.hash(adminPassword, 10)
        : await bcrypt.hash('TempPass123!', 10);

      const admin = await tx.user.create({
        data: {
          email: adminEmail.toLowerCase(),
          name: adminName,
          password: hashedPassword,
          role: 'RETAILER',
          retailerId: retailer.id,
        },
      });

      return { retailer, admin };
    });

    res.status(201).json({
      message: 'Retailer created successfully',
      retailer: result.retailer,
      admin: {
        id: result.admin.id,
        email: result.admin.email,
        name: result.admin.name,
      },
    });
  })
);

// Update retailer
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { businessName, contactName, email, phone, address, markupPercentage, status } =
      req.body;

    // Check permissions
    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retailers can't update their own markup or status
    if (req.user!.role === 'RETAILER' && (markupPercentage !== undefined || status)) {
      return res.status(403).json({ error: 'Cannot modify restricted fields' });
    }

    const retailer = await prisma.retailer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!retailer) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    const updated = await prisma.retailer.update({
      where: { id },
      data: {
        ...(businessName && { businessName }),
        ...(contactName && { contactName }),
        ...(email && { email: email.toLowerCase() }),
        ...(phone && { phone }),
        ...(address && { address }),
        ...(markupPercentage !== undefined && { markupPercentage }),
        ...(status && { status }),
      },
    });

    res.json(updated);
  })
);

// Delete retailer (Super Admin only - soft delete)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const retailer = await prisma.retailer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!retailer) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    // Soft delete retailer and all associated users
    await prisma.$transaction([
      prisma.retailer.update({
        where: { id },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      }),
      prisma.user.updateMany({
        where: { retailerId: id },
        data: { deletedAt: new Date() },
      }),
    ]);

    res.json({ message: 'Retailer deleted successfully' });
  })
);

// Get retailer stats
router.get(
  '/:id/stats',
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    if (req.user!.role === 'RETAILER' && req.user!.retailerId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const [quoteStats, orderStats] = await Promise.all([
      prisma.quote.groupBy({
        by: ['status'],
        where: { retailerId: id },
        _count: true,
      }),
      prisma.order.groupBy({
        by: ['status'],
        where: { retailerId: id },
        _count: true,
        _sum: { totalAmount: true },
      }),
    ]);

    const totalQuotes = quoteStats.reduce((sum, s) => sum + s._count, 0);
    const totalOrders = orderStats.reduce((sum, s) => sum + s._count, 0);
    const totalRevenue = orderStats.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0);

    res.json({
      quotes: {
        total: totalQuotes,
        byStatus: quoteStats,
      },
      orders: {
        total: totalOrders,
        byStatus: orderStats,
        totalRevenue,
      },
    });
  })
);

// Generate/Resend invitation code for retailer (Super Admin only)
router.post(
  '/:id/generate-invitation',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const retailer = await prisma.retailer.findFirst({
      where: { id, deletedAt: null },
      include: {
        users: {
          where: { deletedAt: null },
        },
      },
    });

    if (!retailer) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    if (!retailer.users || retailer.users.length === 0) {
      return res.status(400).json({ error: 'No users associated with this retailer' });
    }

    // Generate invitation token and set expiration (7 days)
    const invitationToken = require('crypto').randomBytes(32).toString('hex');
    const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Update all users for this retailer with the invitation token
    const updatedUsers = await Promise.all(
      retailer.users.map(user =>
        prisma.user.update({
          where: { id: user.id },
          data: {
            invitationToken,
            invitationExpires,
            status: 'PENDING',
          },
        })
      )
    );

    res.json({
      message: 'Invitation code generated successfully',
      invitationToken,
      expiresAt: invitationExpires,
      usersUpdated: updatedUsers.length,
    });
  })
);

// Suspend retailer (Super Admin only)
router.patch(
  '/:id/suspend',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { action } = req.body;

    if (!['suspend', 'unsuspend'].includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
    }

    const retailer = await prisma.retailer.findFirst({
      where: { id, deletedAt: null },
    });

    if (!retailer) {
      return res.status(404).json({ error: 'Retailer not found' });
    }

    const status = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE';
    const updated = await prisma.retailer.update({
      where: { id },
      data: { status },
    });

    res.json({
      message: `Retailer ${action}ed successfully`,
      retailer: updated,
    });
  })
);

export { router as retailersRouter };
