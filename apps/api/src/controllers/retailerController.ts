import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '@cushion/database';

export class RetailerController {
  /**
   * Get all retailers
   */
  async getAllRetailers(req: Request, res: Response) {
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
  }

  /**
   * Get single retailer
   */
  async getRetailer(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== id) {
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
  }

  /**
   * Create retailer
   */
  async createRetailer(req: Request, res: Response) {
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

    // Check if retailer email already exists
    const existingRetailer = await prisma.retailer.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (existingRetailer) {
      return res.status(409).json({ error: 'Retailer with this email already exists' });
    }

    // Check if admin email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: adminEmail.toLowerCase() },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'Admin user with this email already exists' });
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
  }

  /**
   * Update retailer
   */
  async updateRetailer(req: Request, res: Response) {
    const { id } = req.params;
    const {
      businessName,
      contactName,
      email,
      phone,
      address,
      markupPercentage,
      status,
    } = req.body;

    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    // Check permissions
    if (userRole === 'RETAILER' && userRetailerId !== id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Retailers can't update their own markup or status
    if (userRole === 'RETAILER' && (markupPercentage !== undefined || status)) {
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
  }

  /**
   * Delete retailer (soft delete)
   */
  async deleteRetailer(req: Request, res: Response) {
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
  }

  /**
   * Get retailer stats
   */
  async getRetailerStats(req: Request, res: Response) {
    const { id } = req.params;
    const userRole = (req as any).user?.role;
    const userRetailerId = (req as any).user?.retailerId;

    if (userRole === 'RETAILER' && userRetailerId !== id) {
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
  }
}

export const retailerController = new RetailerController();
