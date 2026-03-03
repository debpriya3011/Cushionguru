import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const { searchParams } = new URL(req.url)
        const range = searchParams.get('range') || '1Y' // '1Y', '6M', '30D'

        const now = new Date()
        const fromDate = new Date()
        let formatStr = 'month'
        if (range === '30D') {
            fromDate.setDate(now.getDate() - 30)
            formatStr = 'day'
        } else if (range === '6M') {
            fromDate.setMonth(now.getMonth() - 6)
        } else {
            fromDate.setFullYear(now.getFullYear() - 1)
        }

        const orders = await prisma.order.findMany({
            where: {
                retailerId: params.id,
                createdAt: { gte: fromDate }
            },
            select: { createdAt: true, total: true }
        })

        const quotes = await prisma.quote.findMany({
            where: {
                retailerId: params.id,
                createdAt: { gte: fromDate }
            },
            select: { createdAt: true }
        })

        const dataMap: Record<string, { date: string, orders: number, quotes: number, revenue: number }> = {}

        const formatDateKey = (date: Date) => {
            if (formatStr === 'day') {
                return date.toISOString().split('T')[0]
            }
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
        }

        orders.forEach(o => {
            const key = formatDateKey(o.createdAt)
            if (!dataMap[key]) dataMap[key] = { date: key, orders: 0, quotes: 0, revenue: 0 }
            dataMap[key].orders++
            dataMap[key].revenue += Number(o.total)
        })

        quotes.forEach(q => {
            const key = formatDateKey(q.createdAt)
            if (!dataMap[key]) dataMap[key] = { date: key, orders: 0, quotes: 0, revenue: 0 }
            dataMap[key].quotes++
        })

        const sortedData = Object.values(dataMap).sort((a, b) => a.date.localeCompare(b.date))

        // Find the invitation link
        const user = await prisma.user.findFirst({
            where: { retailerId: params.id },
            select: { invitationToken: true, status: true }
        })

        return NextResponse.json({
            chartData: sortedData,
            invitationToken: user?.invitationToken || null,
            userStatus: user?.status,
        })
    } catch (e: any) {
        return NextResponse.json({ error: 'Error fetching analytics' }, { status: 500 })
    }
}
