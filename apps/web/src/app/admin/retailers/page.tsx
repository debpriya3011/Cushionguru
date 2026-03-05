import { prisma } from '@/lib/prisma'
import { RetailersTable } from '@/components/admin/RetailersTable'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { Plus, Users } from 'lucide-react'

export const metadata = {
  title: 'Retailers - Admin Dashboard',
}

async function getRetailers() {
  return prisma.retailer.findMany({
    where: { deletedAt: null },
    include: {
      _count: {
        select: { quotes: true, orders: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export default async function RetailersPage() {
  const retailers = await getRetailers()

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Retailers</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage your retailer accounts and their permissions
          </p>
        </div>
        <Link href="/admin/retailers/new">
          <Button className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Retailer
          </Button>
        </Link>
      </div>

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Users className="h-4 w-4" />
            <span>{retailers.length} retailers</span>
          </div>
          <div className="flex gap-2">
            <span className="text-sm text-gray-600">
              {retailers.filter(r => r.status === 'ACTIVE').length} active
            </span>
          </div>
        </div>

        <RetailersTable retailers={retailers} />
      </div>
    </div>
  )
}
