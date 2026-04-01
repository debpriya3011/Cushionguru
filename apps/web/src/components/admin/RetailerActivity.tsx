import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowRight, Users, TrendingUp, FileText, ShoppingCart } from 'lucide-react'

interface Retailer {
  id: string
  businessName: string
  email: string
  status: string
  createdAt: Date
  _count: {
    quotes: number
    orders: number
  }
  labelFileUrl: string | null
}

interface RetailerActivityProps {
  retailers: Retailer[]
}

export function RetailerActivity({ retailers }: RetailerActivityProps) {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
        <div>
          <CardTitle className="text-lg">Retailer Activity</CardTitle>
          <p className="text-sm text-gray-500">Recent retailer performance</p>
        </div>
        <Link href="/admin/retailers">
          <Button variant="ghost" size="sm">
            Manage Retailers
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </CardHeader>
      <CardContent>
        {retailers.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No retailers yet</p>
            <Link href="/admin/retailers/new">
              <Button variant="outline" className="mt-4">
                Add Your First Retailer
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {retailers.map((retailer) => (
              <Link
                key={retailer.id}
                href={`/admin/retailers/${retailer.id}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors gap-3 block"
              >
                <div className="flex items-center gap-4">
                  {retailer.labelFileUrl ? (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                      <img
                        src={retailer.labelFileUrl}
                        alt={`${retailer.businessName} label`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center text-white font-bold shrink-0">
                      {retailer.businessName.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">
                      {retailer.businessName}
                    </p>
                    <p className="text-sm text-gray-500 truncate">{retailer.email}</p>
                    <p className="text-xs text-gray-400">
                      Joined {formatDate(retailer.createdAt)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:gap-6 ml-14 sm:ml-0">
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-1 text-gray-600">
                      <FileText className="h-4 w-4" />
                      <span>{retailer._count.quotes}</span>
                    </div>
                    <div className="flex items-center gap-1 text-gray-600">
                      <ShoppingCart className="h-4 w-4" />
                      <span>{retailer._count.orders}</span>
                    </div>
                  </div>

                  <Badge
                    variant="secondary"
                    className={retailer.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-700'
                    }
                  >
                    {retailer.status}
                  </Badge>

                  <div className="h-9 px-3 flex items-center justify-center rounded-md text-sm font-medium hover:bg-slate-200 transition-colors">
                    View
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
