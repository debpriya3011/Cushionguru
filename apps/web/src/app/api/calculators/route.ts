import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all calculators
export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const calculators = await prisma.calculator.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { assignments: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(calculators)
  } catch (error) {
    console.error('Failed to fetch calculators:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculators' },
      { status: 500 }
    )
  }
}

// POST - Create new calculator
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { name, description, config, isMaster } = body

    if (!name || !config) {
      return NextResponse.json(
        { error: 'Name and config are required' },
        { status: 400 }
      )
    }

    const calculator = await prisma.calculator.create({
      data: {
        name,
        description,
        config: Object.keys(config || {}).length === 0 ? getDefaultConfig() : config,
        isMaster: isMaster || false,
        status: 'ACTIVE',
        createdById: session.user.id,
      },
    })

    return NextResponse.json(calculator, { status: 201 })
  } catch (error) {
    console.error('Failed to create calculator:', error)
    return NextResponse.json(
      { error: 'Failed to create calculator' },
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
