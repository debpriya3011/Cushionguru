import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { randomBytes } from 'crypto'
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
        const retailerId = params.id

        // Find retailer and its users
        const retailer = await prisma.retailer.findUnique({
            where: { id: retailerId },
            include: {
                user: true,
            },
        })

        if (!retailer) {
            return NextResponse.json(
                { error: 'Retailer not found' },
                { status: 404 }
            )
        }

        if (!retailer.user) {
            return NextResponse.json(
                { error: 'No user associated with this retailer' },
                { status: 400 }
            )
        }

        // Generate invitation token
        const invitationToken = randomBytes(32).toString('hex')
        const invitationExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

        // Update retailer status to PENDING and user with invitation token
        await prisma.user.update({
            where: { retailerId: retailerId },
            data: {
                invitationToken,
                invitationExpires,
                status: 'PENDING',
            },
        })

        // Update retailer status to PENDING
        await prisma.retailer.update({
            where: { id: retailerId },
            data: { status: 'PENDING' },
        })

        const invitationUrl = `${process.env.NEXTAUTH_URL}/invite/accept?token=${invitationToken}`

        return NextResponse.json(
            {
                message: 'Invitation code generated successfully',
                invitationToken,
                invitationUrl,
                expiresAt: invitationExpires,
            },
            { status: 200 }
        )
    } catch (error) {
        console.error('Failed to generate invitation:', error)
        return NextResponse.json(
            { error: 'Failed to generate invitation' },
            { status: 500 }
        )
    }
}
