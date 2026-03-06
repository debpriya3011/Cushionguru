'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
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
  const [supportEmail, setSupportEmail] = useState('support@cushionsaas.com')

  useEffect(() => {
    fetch('/api/platform/branding')
      .then(res => res.json())
      .then(data => {
        if (data.supportEmail) {
          setSupportEmail(data.supportEmail)
        }
      })
      .catch(console.error)
  }, [])

  return (
    <aside className="hidden md:block w-64 flex-shrink-0 bg-white border-r h-[calc(100vh-4rem)] sticky top-16 flex flex-col">
      <nav className="p-4 space-y-1 flex-1 overflow-y-auto">
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

      <div className="p-4 border-t bg-white mt-auto">
        <div className="bg-blue-50 rounded-lg p-4">
          <p className="text-sm font-medium text-blue-900">Need Help?</p>
          <p className="text-xs text-blue-700 mt-1">
            Contact support for assistance
          </p>
          <a
            href={`https://mail.google.com/mail/?view=cm&fs=1&to=${supportEmail}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 hover:underline mt-2 block truncate"
            title={supportEmail}
          >
            {supportEmail}
          </a>
        </div>
      </div>
    </aside>
  )
}
