import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// DELETE - Soft delete a retailer and their associated user account
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
        const now = new Date()

        // We do a transaction to soft-delete both the retailer and their user account
        await prisma.$transaction(async (tx) => {
            // 1. Soft delete compiler assignments/retailer
            const retailer = await tx.retailer.update({
                where: { id: retailerId },
                data: {
                    deletedAt: now,
                    status: 'SUSPENDED'
                }
            })

            // 2. Soft delete and suspend their master user account to block login
            await tx.user.updateMany({
                where: { retailerId: retailerId },
                data: {
                    deletedAt: now,
                    status: 'SUSPENDED'
                }
            })

            return retailer
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
