import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Hard delete a retailer and all their associated data
export async function DELETE(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const retailerId = params.id

        // Perform a hard delete of the retailer and all relational data that does not cascade
        await prisma.$transaction(async (tx) => {
            // Find and delete all orders and order items
            const orders = await tx.order.findMany({ where: { retailerId }, select: { id: true } })
            if (orders.length > 0) {
                const orderIds = orders.map(o => o.id)
                await tx.orderItem.deleteMany({ where: { orderId: { in: orderIds } } })
                await tx.order.deleteMany({ where: { retailerId } })
            }

            // Find and delete all quotes and quote items
            const quotes = await tx.quote.findMany({ where: { retailerId }, select: { id: true } })
            if (quotes.length > 0) {
                const quoteIds = quotes.map(q => q.id)
                await tx.quoteItem.deleteMany({ where: { quoteId: { in: quoteIds } } })
                await tx.quote.deleteMany({ where: { retailerId } })
            }

            // Find and delete users and their notifications
            const users = await tx.user.findMany({ where: { retailerId }, select: { id: true } })
            if (users.length > 0) {
                const userIds = users.map(u => u.id)
                await tx.notification.deleteMany({ where: { userId: { in: userIds } } })
                await tx.user.deleteMany({ where: { retailerId } })
            }

            // Finally, delete the retailer explicitly (assignments will cascade)
            await tx.retailer.delete({
                where: { id: retailerId }
            })
        })

        return NextResponse.json({ message: 'Retailer deleted successfully' })
    } catch (error) {
        console.error('Failed to delete retailer:', error)
        return NextResponse.json(
            { error: 'Failed to delete retailer' },
            { status: 500 }
        )
    }
}

// POST - Resend Invitation
export async function POST(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // TODO: Insert email re-trigger logic here using DB token
    return NextResponse.json({ message: 'Invitation email resent successfully' })
}
