import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Users, FileText, ShoppingCart, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'

interface DashboardStatsProps {
  stats: {
    activeRetailers: number
    totalRetailers: number
    monthlyQuotes: number
    totalOrders: number
    totalRevenue: number
    pendingOrders: number
  }
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const statCards = [
    {
      title: 'Active Retailers',
      value: stats.activeRetailers,
      total: stats.totalRetailers,
      label: 'of total',
      icon: Users,
      trend: '+2',
      trendUp: true,
      color: 'blue',
    },
    {
      title: 'Monthly Quotes',
      value: stats.monthlyQuotes,
      icon: FileText,
      trend: '+12%',
      trendUp: true,
      color: 'green',
    },
    {
      title: 'Total Orders',
      value: stats.totalOrders,
      pending: stats.pendingOrders,
      label: 'pending',
      icon: ShoppingCart,
      trend: '+5%',
      trendUp: true,
      color: 'purple',
    },
    {
      title: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      rawValue: stats.totalRevenue,
      icon: DollarSign,
      trend: '+8%',
      trendUp: true,
      color: 'amber',
    },
  ]

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; icon: string }> = {
      blue: { bg: 'bg-blue-50', text: 'text-blue-700', icon: 'text-blue-600' },
      green: { bg: 'bg-green-50', text: 'text-green-700', icon: 'text-green-600' },
      purple: { bg: 'bg-purple-50', text: 'text-purple-700', icon: 'text-purple-600' },
      amber: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'text-amber-600' },
    }
    return colors[color] || colors.blue
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statCards.map((stat) => {
        const colors = getColorClasses(stat.color)
        const Icon = stat.icon

        return (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${colors.bg}`}>
                <Icon className={`h-4 w-4 ${colors.icon}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{stat.value}</span>
                {stat.total && (
                  <span className="text-sm text-gray-500">
                    of {stat.total}
                  </span>
                )}
                {stat.pending !== undefined && (
                  <span className="text-sm text-amber-600 font-medium">
                    ({stat.pending} pending)
                  </span>
                )}
              </div>
              
              <div className="flex items-center gap-2 mt-2">
                <span className={`flex items-center text-xs font-medium ${
                  stat.trendUp ? 'text-green-600' : 'text-red-600'
                }`}>
                  {stat.trendUp ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.trend}
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
