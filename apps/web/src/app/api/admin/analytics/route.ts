import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'SUPER_ADMIN') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const sixtyDaysAgo = new Date();
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);

        const [
            activeRetailers,
            totalOrders,
            totalRevenueAgg,
            totalQuotes
        ] = await Promise.all([
            prisma.retailer.count({ where: { status: 'ACTIVE', deletedAt: null } }),
            prisma.order.count({ where: { status: { not: 'CANCELLED' } } }),
            prisma.order.aggregate({ _sum: { total: true }, where: { status: { not: 'CANCELLED' } } }),
            prisma.quote.count()
        ]);

        const topRetailers = await prisma.retailer.findMany({
            where: { status: 'ACTIVE', deletedAt: null },
            include: { _count: { select: { orders: true, quotes: true } } },
            orderBy: { orders: { _count: 'desc' } },
            take: 5
        });

        const ordersLast30D = await prisma.order.findMany({
            where: { createdAt: { gte: thirtyDaysAgo }, status: { not: 'CANCELLED' } },
            select: { createdAt: true, total: true }
        });

        // Map trend data
        const dataMap: Record<string, number> = {};
        ordersLast30D.forEach(o => {
            const date = o.createdAt.toISOString().split('T')[0];
            dataMap[date] = (dataMap[date] || 0) + Number(o.total || 0);
        });

        const trendData = Object.entries(dataMap).map(([date, revenue]) => ({ date, revenue })).sort((a, b) => a.date.localeCompare(b.date));

        return NextResponse.json({
            stats: {
                totalRevenue: totalRevenueAgg._sum.total?.toNumber() || 0,
                activeRetailers,
                quotesGenerated: totalQuotes,
                conversionRate: totalQuotes > 0 ? ((totalOrders / totalQuotes) * 100).toFixed(1) : 0,
            },
            trendData,
            topRetailers: topRetailers.map(r => ({
                id: r.id,
                name: r.businessName,
                orders: r._count.orders,
                quotes: r._count.quotes
            }))
        });

    } catch (e: any) {
        return NextResponse.json({ error: 'Failed' }, { status: 500 });
    }
}
