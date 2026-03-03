import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List orders
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const where: any = {}

        if (session.user.role === 'RETAILER') {
            where.retailerId = session.user.retailerId
        }

        const orders = await prisma.order.findMany({
            where,
            include: {
                items: true,
                retailer: session.user.role === 'SUPER_ADMIN' ? {
                    select: { businessName: true },
                } : false,
                _count: {
                    select: { items: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(orders)
    } catch (error) {
        console.error('Failed to fetch orders:', error)
        return NextResponse.json(
            { error: 'Failed to fetch orders' },
            { status: 500 }
        )
    }
}
