import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session || !session.user || !session.user.id) {
        return NextResponse.json({ status: 'UNAUTHENTICATED' }, { status: 401 })
    }

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { status: true, retailer: { select: { status: true } } }
        })

        if (!user) {
            return NextResponse.json({ status: 'UNAUTHENTICATED' }, { status: 401 })
        }

        const isSuspended = user.status === 'SUSPENDED' || user.retailer?.status === 'SUSPENDED'
        const response = NextResponse.json({ isSuspended })
        // Short private cache — safe because data is user-specific and changes rarely.
        // Avoids repeated DB hits when retailer has multiple tabs open polling this endpoint.
        response.headers.set('Cache-Control', 'private, max-age=15, stale-while-revalidate=30')
        return response
    } catch (error) {
        return NextResponse.json({ error: 'Server error' }, { status: 500 })
    }
}
