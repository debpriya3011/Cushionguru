import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url)
        const token = searchParams.get('token')

        if (!token) {
            return NextResponse.json({ error: 'Missing token' }, { status: 400 })
        }

        const user = await prisma.user.findFirst({
            where: {
                invitationToken: token,
                status: 'PENDING',
                invitationExpires: {
                    gte: new Date(),
                },
            },
            include: {
                retailer: true,
            },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'Invalid or expired invitation token' },
                { status: 400 }
            )
        }

        return NextResponse.json({
            email: user.email,
            retailerName: user.retailer?.businessName,
        })
    } catch (error) {
        console.error('Failed to verify invitation:', error)
        return NextResponse.json(
            { error: 'Failed to verify invitation' },
            { status: 500 }
        )
    }
}
