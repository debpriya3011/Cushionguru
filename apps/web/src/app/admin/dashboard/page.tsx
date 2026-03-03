import { prisma } from '@/lib/prisma'
import { DashboardStats } from '@/components/admin/DashboardStats'
import { RecentQuotes } from '@/components/admin/RecentQuotes'
import { RecentOrders } from '@/components/admin/RecentOrders'
import { RetailerActivity } from '@/components/admin/RetailerActivity'
import { QuickActions } from '@/components/admin/QuickActions'

export const metadata = {
  title: 'Admin Dashboard - Cushion Quoting',
}

async function getDashboardStats() {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    activeRetailers,
    totalRetailers,
    monthlyQuotes,
    totalOrders,
    totalRevenue,
    pendingOrders,
  ] = await Promise.all([
    // Active retailers
    prisma.retailer.count({ 
      where: { status: 'ACTIVE', deletedAt: null } 
    }),
    // Total retailers
    prisma.retailer.count({ 
      where: { deletedAt: null } 
    }),
    // Monthly quotes
    prisma.quote.count({ 
      where: { createdAt: { gte: thirtyDaysAgo } } 
    }),
    // Total orders
    prisma.order.count({ 
      where: { status: { not: 'CANCELLED' } } 
    }),
    // Total revenue
    prisma.order.aggregate({ 
      _sum: { total: true },
      where: { status: { not: 'CANCELLED' } }
    }),
    // Pending orders
    prisma.order.count({ 
      where: { status: { in: ['PENDING', 'CONFIRMED', 'IN_PRODUCTION'] } } 
    }),
  ])

  return {
    activeRetailers,
    totalRetailers,
    monthlyQuotes,
    totalOrders,
    totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
    pendingOrders,
  }
}

async function getRecentQuotes() {
  return prisma.quote.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      retailer: {
        select: { businessName: true },
      },
      _count: {
        select: { items: true },
      },
    },
  })
}

async function getRecentOrders() {
  return prisma.order.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      retailer: {
        select: { businessName: true },
      },
      _count: {
        select: { items: true },
      },
    },
  })
}

async function getRetailerStats() {
  const retailers = await prisma.retailer.findMany({
    where: { deletedAt: null, status: 'ACTIVE' },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: {
        select: { quotes: true, orders: true },
      },
    },
  })

  return retailers
}

export default async function AdminDashboardPage() {
  const [stats, recentQuotes, recentOrders, retailerStats] = await Promise.all([
    getDashboardStats(),
    getRecentQuotes(),
    getRecentOrders(),
    getRetailerStats(),
  ])

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here&apos;s what&apos;s happening with your business.
          </p>
        </div>
        <QuickActions />
      </div>

      <DashboardStats stats={stats} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <RecentQuotes quotes={recentQuotes} />
        <RecentOrders orders={recentOrders} />
      </div>

      <RetailerActivity retailers={retailerStats} />
    </div>
  )
}
