import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get calculator config for retailer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Verify access
  if (session.user.role === 'RETAILER' && session.user.retailerId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    // Get the assigned calculator for this retailer
    const assignment = await prisma.retailerCalculatorAssignment.findFirst({
      where: { retailerId: params.id },
      include: {
        retailer: true,
        calculator: {
          include: {
            fabricBrands: {
              include: {
                fabrics: true,
              },
            },
          },
        },
      },
    })

    if (!assignment) {
      // Return default config if no assignment
      return NextResponse.json({ config: getDefaultConfig() })
    }

    // Ensure the config has the expected structure arrays, fallback to defaults if properties are missing
    const defaultConfig = getDefaultConfig();
    const config = Object.assign({}, defaultConfig, assignment.calculator.config as any);

    // Inject live fabric brands and fabrics from the database
    if (assignment.calculator.fabricBrands && assignment.calculator.fabricBrands.length > 0) {
      config.fabricBrands = assignment.calculator.fabricBrands.map((brand: any) => ({
        id: brand.id,
        name: brand.name,
        description: brand.description,
        imageUrl: brand.imageUrl,
        fabrics: brand.fabrics.map((fabric: any) => ({
          id: fabric.id,
          code: fabric.code || fabric.id,
          name: fabric.name,
          imageUrl: fabric.imageUrl,
          priceTier: parseInt(fabric.priceTier.replace('TIER_', '')),
          price: fabric.price ? parseFloat(fabric.price.toString()) : undefined,
          description: fabric.description
        }))
      }))
    }

    // Attach all assets dynamically to the config based on fixed labels
    const allAssets = await prisma.asset.findMany();
    /**
     * Attempt to locate an asset by label or tag.  If a category is provided we
     * restrict to that category which is helpful for zipper/piping/ties images
     * so they don't accidentally match a fabric or shape with a similar name.
     */
    const findAssetUrl = (name: string, category?: string) => {
      const lower = name.toLowerCase();
      const found = allAssets.find(a => {
        if (category && a.category !== category) return false;
        return (
          a.originalName.toLowerCase().includes(lower) ||
          a.tags.some((t: string) => t.toLowerCase() === lower)
        );
      });
      return found ? found.url : '';
    };

    if (config.shapes) {
      config.shapes = config.shapes.map((s: any) => ({ ...s, imageUrl: findAssetUrl(s.name) || s.imageUrl || '' }));
    }
    if (config.foamTypes) {
      config.foamTypes = config.foamTypes.map((f: any) => ({ ...f, imageUrl: findAssetUrl(f.name) || f.imageUrl || '' }));
    }
    if (config.zipperPositions) {
      config.zipperPositions = config.zipperPositions.map((z: any) => ({
        ...z,
        imageUrl: findAssetUrl(z.name, 'ZIPPER_IMAGE') || z.imageUrl || ''
      }));
    }
    if (config.pipingOptions) {
      config.pipingOptions = config.pipingOptions.map((p: any) => ({
        ...p,
        imageUrl: findAssetUrl(p.name, 'PIPING_IMAGE') || p.imageUrl || ''
      }));
    }
    if (config.tiesOptions) {
      config.tiesOptions = config.tiesOptions.map((t: any) => ({
        ...t,
        imageUrl: findAssetUrl(t.name, 'TIES_IMAGE') || t.imageUrl || ''
      }));
    }

    // Merge with custom pricing if detached
    if (assignment.assignmentType === 'DETACHED' && assignment.customPricing) {
      // Apply custom pricing overrides
    }

    // Assign the preferences back
    const retailerPreferences = {
      pdfPreference: (assignment.retailer as any).pdfPreference,
      labelPreference: (assignment.retailer as any).labelPreference,
    }

    return NextResponse.json({ config, preferences: retailerPreferences })
  } catch (error) {
    console.error('Failed to fetch calculator config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch calculator config' },
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
