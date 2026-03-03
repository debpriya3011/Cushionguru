import { Request, Response } from 'express';
import { prisma } from '@cushion/database';
import { uploadFile, generateFileKey } from '../services/storage';

export class AssetController {
  /**
   * Get all assets
   */
  async getAllAssets(req: Request, res: Response) {
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
  }

  /**
   * Get single asset
   */
  async getAsset(req: Request, res: Response) {
    const { id } = req.params;

    const asset = await prisma.asset.findFirst({
      where: { id, deletedAt: null },
    });

    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }

    res.json(asset);
  }

  /**
   * Upload asset
   */
  async uploadAsset(req: Request, res: Response) {
    const { name, type, category, metadata } = req.body;
    const file = req.file;
    const uploadedById = (req as any).user?.id;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    // Generate file key and upload
    const key = generateFileKey(type, category || 'general', file.originalname);
    const uploadResult = await uploadFile(file.buffer, key, file.mimetype);

    const asset = await prisma.asset.create({
      data: {
        name,
        type,
        url: uploadResult.url,
        category: category || null,
        metadata: metadata ? JSON.parse(metadata) : {},
        size: file.size,
        mimeType: file.mimetype,
        uploadedById,
      },
    });

    res.status(201).json(asset);
  }

  /**
   * Update asset
   */
  async updateAsset(req: Request, res: Response) {
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
  }

  /**
   * Delete asset (soft delete)
   */
  async deleteAsset(req: Request, res: Response) {
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
  }

  /**
   * Get fabrics by tier
   */
  async getFabricsByTier(req: Request, res: Response) {
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
  }

  /**
   * Get assets by type
   */
  async getAssetsByType(req: Request, res: Response) {
    const { type } = req.params;

    const assets = await prisma.asset.findMany({
      where: {
        type: type.toUpperCase(),
        deletedAt: null,
      },
      orderBy: { name: 'asc' },
    });

    res.json(assets);
  }
}

export const assetController = new AssetController();
