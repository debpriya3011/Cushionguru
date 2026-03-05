'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Plus,
  Search,
  MoreHorizontal,
  Edit,
  Copy,
  Trash2,
  Eye,
  Calculator,
  CheckCircle,
  XCircle
} from 'lucide-react'

interface Calculator {
  id: string
  name: string
  description: string | null
  status: string
  isMaster: boolean
  version: number
  createdAt: string
  _count?: {
    assignments: number
  }
}

export default function CalculatorsPage() {
  const [calculators, setCalculators] = useState<Calculator[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)

  useEffect(() => {
    fetchCalculators()
  }, [])

  const fetchCalculators = async () => {
    try {
      const res = await fetch('/api/calculators')
      const data = await res.json()
      setCalculators(Array.isArray(data) ? data : [])
    } catch (error) {
      console.error('Failed to fetch calculators:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDuplicate = async (id: string) => {
    try {
      const res = await fetch(`/api/calculators/${id}/duplicate`, {
        method: 'POST',
      })
      if (res.ok) {
        alert('Calculator duplicated successfully!')
        fetchCalculators()
      } else {
        const err = await res.json()
        alert(`Failed to duplicate: ${err.error || 'Unknown error'}`)
      }
    } catch (error) {
      console.error('Failed to duplicate calculator:', error)
      alert('An unexpected error occurred during duplication.')
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return

    try {
      const res = await fetch(`/api/calculators/${deleteId}`, {
        method: 'DELETE',
      })
      if (res.ok) {
        fetchCalculators()
      }
    } catch (error) {
      console.error('Failed to delete calculator:', error)
    } finally {
      setDeleteId(null)
    }
  }

  const filteredCalculators = calculators.filter(calc =>
    calc.name.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    ACTIVE: 'bg-green-100 text-green-700',
    ARCHIVED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Calculators</h1>
          <p className="text-sm md:text-base text-gray-600 mt-1">
            Manage calculator templates and assign to retailers
          </p>
        </div>
        {/* <Link href="/admin/calculators/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Calculator
          </Button>
        </Link> */}
      </div>

      <Card>
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <CardTitle className="text-lg">All Calculators</CardTitle>
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search calculators..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto" />
            </div>
          ) : filteredCalculators.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Calculator className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p>No calculators found</p>
              <Link href="/admin/calculators/new">
                <Button variant="outline" className="mt-4">
                  Create Your First Calculator
                </Button>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Assigned To</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="w-12"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCalculators.map((calc) => (
                    <TableRow key={calc.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{calc.name}</p>
                          {calc.description && (
                            <p className="text-sm text-gray-500 truncate max-w-xs">
                              {calc.description}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={statusColors[calc.status]}>
                          {calc.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {calc.isMaster ? (
                          <Badge variant="outline" className="border-blue-200 text-blue-700">
                            Master
                          </Badge>
                        ) : (
                          <span className="text-gray-500">-</span>
                        )}
                      </TableCell>
                      <TableCell>v{calc.version}</TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">
                          {calc._count?.assignments || 0} retailers
                        </span>
                      </TableCell>
                      <TableCell>
                        {new Date(calc.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                            <Link href={`/admin/calculators/${calc.id}`}>
                              <DropdownMenuItem>
                                <Eye className="mr-2 h-4 w-4" />
                                Preview
                              </DropdownMenuItem>
                            </Link>

                            <Link href={`/admin/calculators/${calc.id}/edit`}>
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            </Link>

                            {/* <DropdownMenuItem onClick={() => handleDuplicate(calc.id)}>
                            <Copy className="mr-2 h-4 w-4" />
                            Duplicate
                          </DropdownMenuItem> */}

                            <Link href={`/admin/calculators/${calc.id}/assign`}>
                              <DropdownMenuItem>
                                <CheckCircle className="mr-2 h-4 w-4" />
                                Assign to Retailers
                              </DropdownMenuItem>
                            </Link>

                            <DropdownMenuSeparator />

                            {/* <DropdownMenuItem
                            onClick={() => setDeleteId(calc.id)}
                            className="text-red-600"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem> */}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Calculator?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The calculator will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
