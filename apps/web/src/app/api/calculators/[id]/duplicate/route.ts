import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Fetch the original calculator and all nested items
        const original = await prisma.calculator.findUnique({
            where: { id: params.id },
            include: {
                fabricBrands: {
                    include: {
                        fabrics: true
                    }
                }
            }
        })

        if (!original) {
            return NextResponse.json({ error: 'Calculator not found' }, { status: 404 })
        }

        // Duplicate the calculator
        const duplicated = await prisma.calculator.create({
            data: {
                name: `${original.name} (Copy)`,
                description: original.description,
                status: 'DRAFT',
                isMaster: false,
                version: 1,
                config: original.config || {},
                createdById: session.user.id,
                parentId: original.id,
                fabricBrands: {
                    create: original.fabricBrands.map(brand => ({
                        name: brand.name,
                        description: brand.description,
                        fabrics: {
                            create: brand.fabrics.map(fabric => ({
                                name: fabric.name,
                                code: fabric.code,
                                description: fabric.description,
                                imageUrl: fabric.imageUrl,
                                price: fabric.price,
                                priceTier: fabric.priceTier,
                            }))
                        }
                    }))
                }
            }
        })

        return NextResponse.json(duplicated)
    } catch (error: any) {
        console.error('Failed to duplicate calculator:', error)
        return NextResponse.json({ error: error.message || 'Failed to duplicate calculator' }, { status: 500 })
    }
}
