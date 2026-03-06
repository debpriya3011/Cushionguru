'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import {
  LayoutDashboard,
  PlusCircle,
  FileText,
  ShoppingCart,
  Settings,
  HelpCircle,
} from 'lucide-react'

const navigation = [
  { name: 'Dashboard', href: '/retailer/dashboard', icon: LayoutDashboard },
  { name: 'New Quote', href: '/retailer/quotes/new', icon: PlusCircle },
  { name: 'Quotes', href: '/retailer/quotes', icon: FileText },
  { name: 'Orders', href: '/retailer/orders', icon: ShoppingCart },
  { name: 'Settings', href: '/retailer/settings', icon: Settings },
]

export function RetailerSidebar() {
  const pathname = usePathname()

  return (
    <aside className="hidden md:block w-64 flex-shrink-0 bg-white border-r h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
        {navigation.map((item) => {
          let isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)

          // Prevent 'Quotes' tab from highlighting when 'New Quote' is active
          if (item.name === 'Quotes' && pathname === '/retailer/quotes/new') {
            isActive = false
          }

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

      <div className="p-4 border-t bg-white mt-auto">
        <Link
          href="/retailer/help"
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
        >
          <HelpCircle className="h-5 w-5" />
          Help & Support
        </Link>
      </div>
    </aside>
  )
}
