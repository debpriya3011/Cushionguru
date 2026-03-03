import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single calculator
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const calculator = await prisma.calculator.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        fabricBrands: {
          include: {
            fabrics: true,
          },
        },
        assignments: {
          include: {
            retailer: {
              select: { businessName: true, id: true },
            },
          },
        },
        _count: {
          select: { assignments: true },
        },
      },
    })

    if (!calculator) {
      return NextResponse.json(
        { error: 'Calculator not found' },
        { status: 404 }
      )
    }

    const config = Object.assign({}, getDefaultConfig(), calculator.config as any);
    if (calculator.fabricBrands && calculator.fabricBrands.length > 0) {
      config.fabricBrands = calculator.fabricBrands.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        imageUrl: brand.imageUrl,
        fabrics: brand.fabrics.map((fabric: any) => ({
          id: fabric.id,
          code: fabric.code || fabric.id,
          name: fabric.name,
          imageUrl: fabric.imageUrl,
          priceTier: fabric.priceTier.replace('TIER_', ''),
          price: fabric.price ? parseFloat(fabric.price.toString()) : undefined,
          description: fabric.description
        }))
      }));
    }

    // Attach all assets dynamically to the config based on fixed labels, if necessary
    // This allows dynamically uploaded assets to replace shapes and foams
    const allAssets = await prisma.asset.findMany();
    const findAssetUrl = (name: string, categoryPrefix: string) => {
      const found = allAssets.find(a =>
        a.originalName.toLowerCase().includes(name.toLowerCase()) ||
        a.tags.some((t: string) => t.toLowerCase() === name.toLowerCase())
      );
      return found ? found.url : '';
    };

    if (config.shapes) {
      config.shapes = config.shapes.map((s: any) => ({ ...s, imageUrl: findAssetUrl(s.name, 'SHAPE') || s.imageUrl || '' }));
    }
    if (config.foamTypes) {
      config.foamTypes = config.foamTypes.map((f: any) => ({ ...f, imageUrl: findAssetUrl(f.name, 'FOAM') || f.imageUrl || '' }));
    }
    if (config.zipperPositions) {
      config.zipperPositions = config.zipperPositions.map((z: any) => ({ ...z, imageUrl: findAssetUrl(z.name, 'ZIPPER') || z.imageUrl || '' }));
    }
    if (config.pipingOptions) {
      config.pipingOptions = config.pipingOptions.map((p: any) => ({ ...p, imageUrl: findAssetUrl(p.name, 'PIPING') || p.imageUrl || '' }));
    }
    if (config.tiesOptions) {
      config.tiesOptions = config.tiesOptions.map((t: any) => ({ ...t, imageUrl: findAssetUrl(t.name, 'TIES') || t.imageUrl || '' }));
    }

    calculator.config = config;

    return NextResponse.json(calculator)
  } catch (error) {
    console.error('Failed to fetch calculator:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculator' },
      { status: 500 }
    )
  }
}

function getDefaultConfig() {
  return {
    name: 'Default Calculator',
    productTypes: [
      { id: 'sofa-cushion', name: 'Sofa Cushion', availableShapes: ['Rectangle', 'T Cushion', 'L Shape'] },
      { id: 'pillow', name: 'Pillow', availableShapes: ['Rectangle', 'Round'] },
      { id: 'outdoor-cushion', name: 'Outdoor Cushion', availableShapes: ['Rectangle', 'Trapezium', 'Round'] },
    ],
    shapes: [
      { id: 'Rectangle', name: 'Rectangle', imageUrl: '/shapes/rectangle.svg', dimensions: ['length', 'width', 'thickness'] },
      { id: 'Round', name: 'Round', imageUrl: '/shapes/round.svg', dimensions: ['diameter', 'thickness'] },
      { id: 'Triangle', name: 'Triangle', imageUrl: '/shapes/triangle.svg', dimensions: ['length', 'width', 'thickness'] },
      { id: 'Trapezium', name: 'Trapezium', imageUrl: '/shapes/trapezium.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness'] },
      { id: 'T Cushion', name: 'T Cushion', imageUrl: '/shapes/t-cushion.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness', 'ear'] },
      { id: 'L Shape', name: 'L Shape', imageUrl: '/shapes/l-shape.svg', dimensions: ['length', 'bottomWidth', 'topWidth', 'thickness', 'ear'] },
    ],
    foamTypes: [
      { id: 'High Density Foam', name: 'High Density Foam', imageUrl: '/foams/high-density.svg' },
      { id: 'Dry Fast Foam', name: 'Dry Fast Foam', imageUrl: '/foams/dry-fast.svg' },
      { id: 'Fiber Fill', name: 'Fiber Fill', imageUrl: '/foams/fiber-fill.svg' },
      { id: 'Covers Only', name: 'Covers Only', imageUrl: '/foams/covers-only.svg' },
    ],
    fabricBrands: [],
    zipperPositions: [
      { id: 'No Zipper', name: 'No Zipper' },
      { id: 'Long Side', name: 'Long Side', imageUrl: '/options/zipper-long.svg' },
      { id: 'Short Side', name: 'Short Side', imageUrl: '/options/zipper-short.svg' },
    ],
    pipingOptions: [
      { id: 'No Piping', name: 'No Piping', imageUrl: '/options/no-piping.svg' },
      { id: 'Piping', name: 'Piping', imageUrl: '/options/piping.svg' },
    ],
    tiesOptions: [
      { id: 'No ties', name: 'No Ties', imageUrl: '/options/no-ties.svg' },
      { id: '2 Side', name: '2 Side', imageUrl: '/options/ties-2.svg' },
      { id: '4 Side', name: '4 Side', imageUrl: '/options/ties-4.svg' },
      { id: '4 Corner', name: '4 Corner', imageUrl: '/options/ties-4c.svg' },
    ],
    dimensionRanges: {
      length: { min: 6, max: 120, step: 0.5, unit: 'inches' },
      width: { min: 6, max: 120, step: 0.5, unit: 'inches' },
      thickness: { min: 1, max: 12, step: 0.5, unit: 'inches' },
      diameter: { min: 6, max: 60, step: 0.5, unit: 'inches' },
      bottomWidth: { min: 6, max: 120, step: 0.5, unit: 'inches' },
      topWidth: { min: 6, max: 120, step: 0.5, unit: 'inches' },
      ear: { min: 2, max: 24, step: 0.5, unit: 'inches' },
    },
  }
}

// PUT - Update calculator
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, config, status } = body

    const updateData: any = {}
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (config) updateData.config = config
    if (status) updateData.status = status

    // If updating a master calculator, increment version
    const existing = await prisma.calculator.findUnique({
      where: { id: params.id },
    })

    if (existing?.isMaster && config) {
      updateData.version = { increment: 1 }
    }

    const calculator = await prisma.calculator.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(calculator)
  } catch (error) {
    console.error('Failed to update calculator:', error)
    return NextResponse.json(
      { error: 'Failed to update calculator' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete calculator
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    await prisma.calculator.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        status: 'ARCHIVED',
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete calculator:', error)
    return NextResponse.json(
      { error: 'Failed to delete calculator' },
      { status: 500 }
    )
  }
}
