import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single order
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                items: true,
                retailer: {
                    select: { businessName: true },
                },
            },
        })

        if (!order) {
            return NextResponse.json({ error: 'Order not found' }, { status: 404 })
        }

        if (session.user.role === 'RETAILER' && order.retailerId !== session.user.retailerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        return NextResponse.json(order)
    } catch (error) {
        return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 })
    }
}

// PUT - Update order status (and metadata if needed)
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
        const { status, estimatedDeliveryDate, shippingTrackingNumber } = body

        const order = await prisma.order.findUnique({
            where: { id: params.id },
        })

        if (!order) return NextResponse.json({ error: 'Not found' }, { status: 404 })

        const updated = await prisma.$transaction(async (tx) => {
            const u = await tx.order.update({
                where: { id: params.id },
                data: {
                    ...(status && { status }),
                    ...(estimatedDeliveryDate !== undefined && { estimatedDeliveryDate: estimatedDeliveryDate ? new Date(estimatedDeliveryDate) : null }),
                    ...(shippingTrackingNumber !== undefined && { shippingTrackingNumber }),
                }
            });

            // Notify Retailer if status changed
            if (status && status !== order.status) {
                const retailerUser = await tx.user.findFirst({ where: { retailerId: order.retailerId } });
                if (retailerUser) {
                    await tx.notification.create({
                        data: {
                            userId: retailerUser.id,
                            title: `Order Status: ${status.replace('_', ' ')}`,
                            message: `Your tracking code ${order.orderNumber} is now marked as ${status.replace('_', ' ')}.`,
                            link: `/retailer/orders/${order.id}`
                        }
                    });
                }
            }

            return u;
        });

        return NextResponse.json(updated)
    } catch (error) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 })
    }
}
