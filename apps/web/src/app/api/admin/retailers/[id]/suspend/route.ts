import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PATCH(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const retailerId = params.id
        const data = await req.json()
        const { action } = data // 'suspend' or 'unsuspend'

        const newStatus = action === 'suspend' ? 'SUSPENDED' : 'ACTIVE'

        await prisma.$transaction(async (tx) => {
            // Update retailer status
            const retailer = await tx.retailer.update({
                where: { id: retailerId },
                data: {
                    status: newStatus,
                }
            })

            // Update associated user status
            await tx.user.updateMany({
                where: { retailerId: retailerId },
                data: {
                    status: newStatus,
                }
            })

            // Find associated users to send notifications
            const affectedUsers = await tx.user.findMany({
                where: { retailerId: retailerId },
                select: { id: true }
            })

            const notificationTitle = action === 'suspend' ? 'Account Suspended' : 'Account Suspension Revoked'
            const notificationMessage = action === 'suspend'
                ? 'Your account has been suspended by the administrator. Please contact support for more information.'
                : 'Your account suspension has been revoked. You can now access the portal.'

            if (affectedUsers.length > 0) {
                await tx.notification.createMany({
                    data: affectedUsers.map(u => ({
                        userId: u.id,
                        title: notificationTitle,
                        message: notificationMessage,
                        link: null,
                    }))
                })
            }

            return retailer
        })

        return NextResponse.json({ message: `Retailer ${action}ed successfully` })
    } catch (error) {
        console.error('Failed to change retailer status:', error)
        return NextResponse.json(
            { error: 'Failed to update retailer status' },
            { status: 500 }
        )
    }
}
