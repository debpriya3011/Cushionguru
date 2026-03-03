import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Plus, 
  FileText, 
  ShoppingCart, 
  TrendingUp, 
  DollarSign,
  Clock,
  CheckCircle
} from 'lucide-react'

export const metadata = {
  title: 'Dashboard - Retailer Portal',
}

async function getRetailerStats(retailerId: string) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const [
    totalQuotes,
    monthlyQuotes,
    totalOrders,
    monthlyOrders,
    totalRevenue,
    pendingQuotes,
  ] = await Promise.all([
    prisma.quote.count({ where: { retailerId } }),
    prisma.quote.count({ 
      where: { retailerId, createdAt: { gte: thirtyDaysAgo } } 
    }),
    prisma.order.count({ where: { retailerId } }),
    prisma.order.count({ 
      where: { retailerId, createdAt: { gte: thirtyDaysAgo } } 
    }),
    prisma.order.aggregate({ 
      _sum: { total: true },
      where: { retailerId, status: { not: 'CANCELLED' } }
    }),
    prisma.quote.count({ 
      where: { retailerId, status: 'DRAFT' } 
    }),
  ])

  return {
    totalQuotes,
    monthlyQuotes,
    totalOrders,
    monthlyOrders,
    totalRevenue: totalRevenue._sum.total?.toNumber() || 0,
    pendingQuotes,
  }
}

async function getRecentQuotes(retailerId: string) {
  return prisma.quote.findMany({
    where: { retailerId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })
}

async function getRecentOrders(retailerId: string) {
  return prisma.order.findMany({
    where: { retailerId },
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: {
      _count: { select: { items: true } },
    },
  })
}

export default async function RetailerDashboardPage() {
  const session = await getServerSession(authOptions)
  const retailerId = session?.user?.retailerId

  if (!retailerId) {
    return <div>Retailer not found</div>
  }

  const [stats, recentQuotes, recentOrders] = await Promise.all([
    getRetailerStats(retailerId),
    getRecentQuotes(retailerId),
    getRecentOrders(retailerId),
  ])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(value)
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
    }).format(new Date(date))
  }

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    CONVERTED: 'bg-purple-100 text-purple-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    CONFIRMED: 'bg-blue-100 text-blue-700',
    IN_PRODUCTION: 'bg-purple-100 text-purple-700',
    SHIPPED: 'bg-cyan-100 text-cyan-700',
    DELIVERED: 'bg-green-100 text-green-700',
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome & Quick Actions */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            Welcome back, {session.user.name?.split(' ')[0] || 'Retailer'}
          </h1>
          <p className="text-gray-600 mt-1">
            Here&apos;s what&apos;s happening with your business today.
          </p>
        </div>
        <Link href="/retailer/quotes/new">
          <Button size="lg">
            <Plus className="mr-2 h-5 w-5" />
            New Quote
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Quotes</p>
                <p className="text-2xl font-bold">{stats.totalQuotes}</p>
                <p className="text-xs text-green-600">+{stats.monthlyQuotes} this month</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Total Orders</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-xs text-green-600">+{stats.monthlyOrders} this month</p>
              </div>
              <div className="p-3 bg-green-100 rounded-lg">
                <ShoppingCart className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Revenue</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</p>
                <p className="text-xs text-gray-500">Lifetime</p>
              </div>
              <div className="p-3 bg-amber-100 rounded-lg">
                <DollarSign className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Quotes</p>
                <p className="text-2xl font-bold">{stats.pendingQuotes}</p>
                <p className="text-xs text-amber-600">Need attention</p>
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Quotes */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Quotes</CardTitle>
            <Link href="/retailer/quotes">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentQuotes.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No quotes yet</p>
                <Link href="/retailer/quotes/new">
                  <Button variant="outline" className="mt-4">Create Your First Quote</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {recentQuotes.map((quote) => (
                  <div
                    key={quote.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{quote.quoteNumber}</p>
                      <p className="text-sm text-gray-500">
                        {quote.customerName} • {quote._count.items} items
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(quote.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(quote.total.toNumber())}</p>
                      <Badge variant="secondary" className={statusColors[quote.status]}>
                        {quote.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <Link href="/retailer/orders">
              <Button variant="ghost" size="sm">View All</Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <ShoppingCart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                <p>No orders yet</p>
                <p className="text-sm mt-2">Convert quotes to orders to see them here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{order.orderNumber}</p>
                      <p className="text-sm text-gray-500">
                        {order.customerName} • {order._count.items} items
                      </p>
                      <p className="text-xs text-gray-400">{formatDate(order.createdAt)}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatCurrency(order.total.toNumber())}</p>
                      <Badge variant="secondary" className={statusColors[order.status]}>
                        {order.status.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
