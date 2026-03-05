'use client'

import Link from 'next/link'
import { signOut } from 'next-auth/react'
import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { LogOut, User, Settings, Shield, Menu, LayoutDashboard, Users, Calculator, FileText, ShoppingCart, ImageIcon, BarChart3 } from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface AdminHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
}

const mobileNav = [
  { name: 'Dashboard', href: '/admin/dashboard', icon: LayoutDashboard },
  { name: 'Retailers', href: '/admin/retailers', icon: Users },
  { name: 'Calculators', href: '/admin/calculators', icon: Calculator },
  { name: 'Quotes', href: '/admin/quotes', icon: FileText },
  { name: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  { name: 'Assets', href: '/admin/assets', icon: ImageIcon },
  { name: 'Analytics', href: '/admin/analytics', icon: BarChart3 },
  { name: 'Settings', href: '/admin/settings', icon: Settings },
]

export function AdminHeader({ user }: AdminHeaderProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [branding, setBranding] = useState<{ logoUrl: string; companyName: string }>({
    logoUrl: '',
    companyName: 'Cushion Quoting',
  })

  useEffect(() => {
    fetch('/api/platform/branding')
      .then(res => res.json())
      .then(data => setBranding(data))
      .catch(console.error)
  }, [])

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left - Logo & Mobile Menu */}
        <div className="flex items-center gap-3 md:gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 flex flex-col">
              <div className="flex-1 overflow-y-auto mt-8 pb-8 pr-2 space-y-1">
                {mobileNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                    >
                      <Icon className="h-5 w-5" />
                      {item.name}
                    </Link>
                  )
                })}
              </div>
            </SheetContent>
          </Sheet>

          {/* Logo */}
          <Link href="/admin/dashboard" className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center overflow-hidden ${branding.logoUrl ? '' : 'bg-blue-600 rounded-lg'}`}>
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white font-bold text-lg">C</span>
              )}
            </div>
            <div className="hidden sm:block">
              <h1 className="font-bold text-gray-900">{branding.companyName}</h1>
              <p className="text-xs text-gray-500">Admin Portal</p>
            </div>
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 md:gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user.name?.charAt(0) || 'A'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{user.name || 'Admin'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem>
                <User className="mr-2 h-4 w-4" />
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem>
                <Shield className="mr-2 h-4 w-4" />
                Admin Panel
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}
