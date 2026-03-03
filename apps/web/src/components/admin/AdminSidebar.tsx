'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  Users,
  Calculator,
  ImageIcon,
  Settings,
  FileText,
  ShoppingCart,
  BarChart3,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Retailers', href: '/admin/retailers', icon: Users },
  { name: 'Calculators', href: '/admin/calculators', icon: Calculator },
  { name: 'Quotes', href: '/admin/quotes', icon: FileText },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Assets', href: '/admin/assets', icon: ImageIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminSidebar() {
  const pathname = usePathname()

  return (
    <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] sticky top-16 z-50">
      <nav className="p-4 space-y-1">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
          const Icon = item.icon

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                isActive
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-700 hover:bg-gray-100'
              )}
            >
              <Icon className="h-5 w-5" />
              {item.name}
            </Link>
          )
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">Need Help?</p>
          <p className="text-xs text-blue-700 mt-1">
            Contact support for assistance
          </p>
          <a
            href="mailto:support@cushionsaas.com"
            className="text-xs text-blue-600 hover:underline mt-2 inline-block"
          >
            support@cushionsaas.com
          </a>
        </div>
      </div>
    </aside>
  )
}
