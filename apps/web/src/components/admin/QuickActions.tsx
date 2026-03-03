'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Plus, Users, Calculator, FileText, ChevronDown } from 'lucide-react'

export function QuickActions() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Quick Actions
          <ChevronDown className="ml-2 h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Create New</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <Link href="/admin/retailers/new">
          <DropdownMenuItem>
            <Users className="mr-2 h-4 w-4" />
            Add Retailer
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/calculators/new">
          <DropdownMenuItem>
            <Calculator className="mr-2 h-4 w-4" />
            Create Calculator
          </DropdownMenuItem>
        </Link>
        
        <Link href="/admin/quotes/new">
          <DropdownMenuItem>
            <FileText className="mr-2 h-4 w-4" />
            Create Quote
          </DropdownMenuItem>
        </Link>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
