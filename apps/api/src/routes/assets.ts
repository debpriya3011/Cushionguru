import { Router } from 'express';
import { prisma } from '@cushion/database';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthenticatedRequest, requireRole } from '../middleware/auth';
import { uploadSingle } from '../middleware/upload';

const router = Router();

// Get all assets
router.get(
  '/',
  asyncHandler(async (req, res) => {
    const { type, category, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    const where: any = { deletedAt: null };

    if (type) {
      where.type = type;
    }

    if (category) {
      where.category = category;
    }

    if (search) {
      where.name = { contains: search as string, mode: 'insensitive' };
    }

    const [assets, total] = await Promise.all([
      prisma.asset.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.asset.count({ where }),
    ]);

    res.json({
      assets,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  })
);

// Get single asset
router.get(
  '/:id',
  asyncHandler(async (req, res) => {
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  })
);

// Upload asset (Super Admin only)
router.post(
  '/',
  requireRole('SUPER_ADMIN'),
  uploadSingle('file'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { name, type, category, metadata } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Upload to storage service (S3, Cloudinary, etc.)
    // For now, we'll store base64 data
    const base64Data = file.buffer.toString('base64');
    const url = `data:${file.mimetype};base64,${base64Data}`;

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        url,
        category: category || null,
        metadata: metadata ? JSON.parse(metadata) : {},
        size: file.size,
        mimeType: file.mimetype,
        uploadedById: req.user!.id,
      },
    });

    res.status(201).json(asset);
  })
);

// Update asset (Super Admin only)
router.patch(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;
    const { name, category, metadata } = req.body;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    const updated = await prisma.asset.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(category !== undefined && { category }),
        ...(metadata && { metadata: JSON.parse(metadata) }),
      },
    });

    res.json(updated);
  })
);

// Delete asset (Super Admin only - soft delete)
router.delete(
  '/:id',
  requireRole('SUPER_ADMIN'),
  asyncHandler(async (req: AuthenticatedRequest, res) => {
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    await prisma.asset.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    res.json({ message: 'Asset deleted successfully' });
  })
);

// Get fabrics by tier
router.get(
  '/fabrics/by-tier',
  asyncHandler(async (req, res) => {
    const fabrics = await prisma.asset.findMany({
      where: {
        type: 'FABRIC',
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    // Group by tier from metadata
    const grouped = fabrics.reduce((acc: any, fabric) => {
      const tier = fabric.metadata?.tier || 'Uncategorized';
      if (!acc[tier]) {
        acc[tier] = [];
      }
      acc[tier].push(fabric);
      return acc;
    }, {});

    res.json(grouped);
  })
);

export { router as assetsRouter };
