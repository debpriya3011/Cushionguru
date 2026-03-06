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
import {
  LogOut,
  User,
  Settings,
  Bell,
  Menu,
  Plus,
  FileText,
  ShoppingCart,
  LayoutDashboard,
  HelpCircle,
} from 'lucide-react'
import { NotificationBell } from '@/components/notifications/NotificationBell'

interface RetailerHeaderProps {
  user: {
    name?: string | null
    email?: string | null
    retailer?: {
      businessName?: string
    }
  }
}

export function RetailerHeader({ user }: RetailerHeaderProps) {
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

  const mobileNav = [
    { name: 'Dashboard', href: '/retailer/dashboard', icon: LayoutDashboard },
    { name: 'New Quote', href: '/retailer/quotes/new', icon: Plus },
    { name: 'Quotes', href: '/retailer/quotes', icon: FileText },
    { name: 'Orders', href: '/retailer/orders', icon: ShoppingCart },
    { name: 'Settings', href: '/retailer/settings', icon: Settings },
    { name: 'Help & Support', href: '/retailer/help', icon: HelpCircle },
  ]

  return (
    <header className="bg-white border-b sticky top-0 z-50">
      <div className="px-4 md:px-8 h-16 flex items-center justify-between">
        {/* Left - Logo & Mobile Menu */}
        <div className="flex items-center gap-4">
          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 flex flex-col p-0">
              <div className="p-6 pr-14 border-b">
                <Link href="/retailer/dashboard" className="flex items-center gap-3">
                  <div className={`w-8 h-8 flex items-center justify-center overflow-hidden shrink-0 ${branding.logoUrl ? '' : 'bg-blue-600 rounded-lg'}`}>
                    {branding.logoUrl ? (
                      <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                    ) : (
                      <span className="text-white font-bold text-sm">C</span>
                    )}
                  </div>
                  <div className="flex flex-col min-w-0">
                    <h1 className="font-bold text-gray-900 truncate">{user.retailer?.businessName || branding.companyName}</h1>
                    <p className="text-[10px] text-gray-500 truncate">
                      {user.retailer?.businessName ? `Powered by ${branding.companyName}` : 'Retailer Portal'}
                    </p>
                  </div>
                </Link>
              </div>
              <div className="flex-1 overflow-y-auto py-4 px-2 space-y-1 mt-2">
                {mobileNav.map((item) => {
                  const Icon = item.icon
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100"
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
          <Link href="/retailer/dashboard" className="flex items-center gap-3">
            <div className={`w-10 h-10 flex items-center justify-center overflow-hidden ${branding.logoUrl ? '' : 'bg-blue-600 rounded-lg'}`}>
              {branding.logoUrl ? (
                <img src={branding.logoUrl} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <span className="text-white font-bold text-lg">C</span>
              )}
            </div>
            <div className="flex flex-col min-w-0 max-w-[130px] sm:max-w-xs">
              <h1 className="font-bold text-gray-900 truncate">{user.retailer?.businessName || branding.companyName}</h1>
              <p className="text-xs text-gray-500 truncate">
                {user.retailer?.businessName ? `Powered by ${branding.companyName}` : 'Retailer Portal'}
              </p>
            </div>
          </Link>
        </div>

        {/* Right Side */}
        <div className="flex items-center gap-2 md:gap-4">
          {/* Quick New Quote - Desktop */}
          <Link href="/retailer/quotes/new" className="hidden md:block">
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Quote
            </Button>
          </Link>

          {/* Notifications */}
          <NotificationBell />

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 md:gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback className="bg-blue-100 text-blue-700">
                    {user.name?.charAt(0) || 'R'}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden md:block">
                  <p className="text-sm font-medium">{user.name || 'Retailer'}</p>
                  <p className="text-xs text-gray-500">{user.email}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>My Account</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/retailer/settings" className="cursor-pointer w-full">
                  <User className="mr-2 h-4 w-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/retailer/settings" className="cursor-pointer w-full">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
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
