'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { MoreHorizontal, Edit, Trash2, Mail, Eye, Copy, Ban, CheckCircle } from 'lucide-react'

interface Retailer {
  id: string
  businessName: string
  contactName: string
  email: string
  phone: string | null
  status: string
  markupType: string
  markupValue: any
  createdAt: Date
  _count: {
    quotes: number
    orders: number
  }
}

interface RetailersTableProps {
  retailers: Retailer[]
}

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700',
  INACTIVE: 'bg-gray-100 text-gray-700',
  SUSPENDED: 'bg-red-100 text-red-700',
}

export function RetailersTable({ retailers }: RetailersTableProps) {
  const router = useRouter()
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [suspendId, setSuspendId] = useState<string | null>(null)
  const [isSuspending, setIsSuspending] = useState(false)
  const [isChangingStatus, setIsChangingStatus] = useState<string | null>(null)

  const handleDelete = async () => {
    if (!deleteId) return

    setIsDeleting(true)
    try {
      const res = await fetch(`/api/admin/retailers/${deleteId}`, {
        method: 'DELETE',
      })

      if (res.ok) {
        router.refresh()
      }
    } catch (error) {
      console.error('Failed to delete retailer:', error)
    } finally {
      setIsDeleting(false)
      setDeleteId(null)
    }
  }

  const handleStatusChange = async (id: string, action: 'suspend' | 'unsuspend') => {
    setIsChangingStatus(id)
    try {
      const res = await fetch(`/api/admin/retailers/${id}/suspend`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action }),
      })

      if (res.ok) {
        router.refresh()
      } else {
        alert(`Failed to ${action} retailer`)
      }
    } catch (error) {
      console.error(`Failed to ${action} retailer:`, error)
      alert(`Failed to ${action} retailer`)
    } finally {
      setIsChangingStatus(null)
      if (action === 'suspend') setSuspendId(null)
    }
  }

  const handleResendInvitation = async (retailerId: string) => {
    try {
      await fetch(`/api/admin/retailers/${retailerId}/resend-invitation`, {
        method: 'POST',
      })
      alert('Invitation resent successfully')
    } catch (error) {
      alert('Failed to resend invitation')
    }
  }

  const formatMarkup = (type: string, value: number) => {
    if (type === 'PERCENTAGE') {
      return `${value}%`
    }
    return `$${value.toFixed(2)}`
  }

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(date))
  }

  if (retailers.length === 0) {
    return (
      <div className="p-12 text-center">
        <p className="text-gray-500">No retailers found</p>
        <Link href="/admin/retailers/new">
          <Button variant="outline" className="mt-4">
            Add Your First Retailer
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Business</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Markup</TableHead>
              <TableHead>Activity</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {retailers.map((retailer) => (
              <TableRow key={retailer.id}>
                <TableCell>
                  <div>
                    <p className="font-medium">{retailer.businessName}</p>
                    <p className="text-sm text-gray-500">{retailer.email}</p>
                  </div>
                </TableCell>
                <TableCell>
                  <p className="text-sm">{retailer.contactName}</p>
                  {retailer.phone && (
                    <p className="text-sm text-gray-500">{retailer.phone}</p>
                  )}
                </TableCell>
                <TableCell>
                  <span className="text-sm">
                    {formatMarkup(retailer.markupType, typeof retailer.markupValue === 'object' && retailer.markupValue?.toNumber ? retailer.markupValue.toNumber() : Number(retailer.markupValue) || 0)}
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex gap-3 text-sm text-gray-600">
                    <span>{retailer._count.quotes} quotes</span>
                    <span>{retailer._count.orders} orders</span>
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={statusColors[retailer.status]}>
                    {retailer.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <span className="text-sm text-gray-600">
                    {formatDate(retailer.createdAt)}
                  </span>
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

                      <Link href={`/admin/retailers/${retailer.id}`}>
                        <DropdownMenuItem>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                      </Link>

                      {/* <Link href={`/admin/retailers/${retailer.id}/edit`}>
                        <DropdownMenuItem>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                      </Link> */}

                      {/* <DropdownMenuItem onClick={() => handleResendInvitation(retailer.id)}>
                        <Mail className="mr-2 h-4 w-4" />
                        Resend Invitation
                      </DropdownMenuItem> */}

                      <DropdownMenuSeparator />

                      {retailer.status === 'SUSPENDED' ? (
                        <DropdownMenuItem
                          onClick={() => handleStatusChange(retailer.id, 'unsuspend')}
                          disabled={isChangingStatus === retailer.id}
                          className="text-green-600"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Revoke Suspend
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setSuspendId(retailer.id)}
                          disabled={isChangingStatus === retailer.id}
                          className="text-orange-600"
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Suspend
                        </DropdownMenuItem>
                      )}

                      <DropdownMenuItem
                        onClick={() => setDeleteId(retailer.id)}
                        className="text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!suspendId} onOpenChange={() => setSuspendId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Suspend Retailer?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the retailer account. All data will be preserved
              but the retailer will no longer be able to access the system until you revoke the suspension.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => suspendId && handleStatusChange(suspendId, 'suspend')}
              disabled={isChangingStatus !== null}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {isChangingStatus === suspendId ? 'Suspending...' : 'Suspend'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warning: Permanently Delete Retailer?</AlertDialogTitle>
            <AlertDialogDescription className="text-red-600 font-medium">
              You are about to permanently delete this retailer and ALL of their associated data (quotes, orders, users, etc.) from the database.
              This action cannot be undone. A new user will be able to register with this email address afterward.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isDeleting ? 'Deleting...' : 'Permanently Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
