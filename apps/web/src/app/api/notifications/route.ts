import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        // Single query: fetch last 50 notifications and count unread in one round-trip
        const notifications = await prisma.notification.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 50,
        })

        const unreadCount = notifications.filter((n: any) => !n.isRead).length

        const response = NextResponse.json({ notifications, unreadCount })
        // Cache for 10 seconds on the client to reduce repeated identical polls
        response.headers.set('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
        return response
    } catch (error) {
        console.error('Failed to fetch notifications:', error)
        return NextResponse.json(
            { error: 'Failed to fetch notifications' },
            { status: 500 }
        )
    }
}

export async function PUT(req: NextRequest) {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const body = await req.json()
        const { id } = body

        if (id === 'all') {
            await prisma.notification.updateMany({
                where: { userId: session.user.id, isRead: false },
                data: { isRead: true },
            })
        } else if (id) {
            await prisma.notification.update({
                where: { id, userId: session.user.id },
                data: { isRead: true },
            })
        }

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to update notifications:', error)
        return NextResponse.json(
            { error: 'Failed to update notifications' },
            { status: 500 }
        )
    }
}
