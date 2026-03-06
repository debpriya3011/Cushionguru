'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, FileText, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    VIEWED: 'bg-purple-100 text-purple-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
    CONVERTED: 'bg-emerald-100 text-emerald-700',
}

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Unpaid', className: 'bg-gray-100 text-gray-600' },
    UNPAID: { label: 'Unpaid', className: 'bg-gray-100 text-gray-600' },
    SUCCESS: { label: 'Paid ✓', className: 'bg-green-100 text-green-700' },
    FAILED: { label: 'Failed', className: 'bg-red-100 text-red-700' },
    REFUNDED: { label: 'Refunded', className: 'bg-orange-100 text-orange-700' },
}

export default function AdminQuotesPage() {
    const [quotes, setQuotes] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [search, setSearch] = useState('')

    useEffect(() => {
        fetchQuotes()
    }, [])

    const fetchQuotes = async () => {
        try {
            const res = await fetch(`/api/quotes?_=${Date.now()}`, { cache: 'no-store' })
            if (res.ok) {
                const data = await res.json()
                setQuotes(data)
            }
        } catch (error) {
            console.error('Failed to fetch quotes:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        const onFocus = () => fetchQuotes()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [])

    const filteredQuotes = quotes.filter(quote =>
        quote.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
        quote.customerName?.toLowerCase().includes(search.toLowerCase()) ||
        quote.retailer?.businessName?.toLowerCase().includes(search.toLowerCase())
    )

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount)
    }

    const formatDate = (date: string) => {
        return new Intl.DateTimeFormat('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        }).format(new Date(date))
    }

    const downloadLabelPack = async (quote: any) => {
        try {
            const rRes = await fetch(`/api/quotes/${quote.id}/label-pack`)
            if (!rRes.ok) {
                const err = await rRes.json()
                toast({ title: 'Error', description: err.error || 'Could not generate label pack', variant: 'destructive' })
                return
            }
            const blob = await rRes.blob()
            const url = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = `${quote.quoteNumber}-label-pack.zip`
            a.click()
            URL.revokeObjectURL(url)
        } catch {
            toast({ title: 'Download Failed', description: 'Could not download label pack.', variant: 'destructive' })
        }
    }

    // Has label setup: labelPreference ALWAYS or PER_ORDER
    const hasLabelSetup = (q: any) => {
        const labelPref = q.labelPreference || q.retailer?.labelPreference
        return labelPref === 'ALWAYS' || labelPref === 'PER_ORDER'
    }

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">Quotes</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage and track all generated quotes</p>
                </div>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Search quotes..."
                            className="pl-10 h-10 bg-gray-50 border-gray-200"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="p-8 flex justify-center items-center">
                        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
                    </div>
                ) : filteredQuotes.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        {search ? 'No quotes matching your search' : 'No quotes created yet'}
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="whitespace-nowrap">Quote #</TableHead>
                                    <TableHead className="whitespace-nowrap">Retailer</TableHead>
                                    <TableHead className="whitespace-nowrap">Customer</TableHead>
                                    <TableHead className="whitespace-nowrap">Amount</TableHead>
                                    <TableHead className="whitespace-nowrap">Status</TableHead>
                                    <TableHead className="whitespace-nowrap">Payment</TableHead>
                                    <TableHead className="whitespace-nowrap">Date</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.map((quote) => {
                                    const pmtConfig = paymentStatusConfig[quote.paymentStatus] || paymentStatusConfig.PENDING
                                    return (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium text-gray-900 whitespace-nowrap">
                                                {quote.quoteNumber}
                                            </TableCell>
                                            <TableCell className="whitespace-nowrap">
                                                {quote.retailer?.businessName || 'Unknown'}
                                            </TableCell>
                                            <TableCell>
                                                <p className="font-medium text-gray-900 whitespace-nowrap">{quote.customerName}</p>
                                                <p className="text-sm text-gray-500 truncate max-w-[160px]">{quote.customerEmail}</p>
                                            </TableCell>
                                            <TableCell className="font-medium whitespace-nowrap">
                                                {formatCurrency(Number(quote.finalTotal ?? quote.total) || 0)}
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={statusColors[quote.status] || 'bg-gray-100'}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="secondary" className={pmtConfig.className}>
                                                    {pmtConfig.label}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-gray-500 text-sm whitespace-nowrap">
                                                {formatDate(quote.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-1 justify-end">
                                                    {hasLabelSetup(quote) && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 whitespace-nowrap"
                                                            onClick={() => downloadLabelPack(quote)}
                                                            title="Download Label Pack"
                                                        >
                                                            <Download className="h-4 w-4 mr-1" />
                                                            <span className="hidden sm:inline">Label Pack</span>
                                                        </Button>
                                                    )}
                                                    <Link href={`/admin/quotes/${quote.id}`}>
                                                        <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 whitespace-nowrap">
                                                            <FileText className="h-4 w-4 mr-1" />
                                                            <span className="hidden sm:inline">View</span>
                                                        </Button>
                                                    </Link>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}
