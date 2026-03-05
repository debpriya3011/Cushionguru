'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Plus, Search, FileText } from 'lucide-react'
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

const statusColors: Record<string, string> = {
    DRAFT: 'bg-gray-100 text-gray-700',
    SENT: 'bg-blue-100 text-blue-700',
    VIEWED: 'bg-purple-100 text-purple-700',
    ACCEPTED: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    REJECTED: 'bg-red-100 text-red-700',
}

export default function RetailerQuotesPage() {
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

    // Re-fetch whenever the user navigates back to this page
    useEffect(() => {
        const onFocus = () => fetchQuotes()
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
    }, [])

    const filteredQuotes = quotes.filter(quote =>
        quote.quoteNumber?.toLowerCase().includes(search.toLowerCase()) ||
        quote.customerName?.toLowerCase().includes(search.toLowerCase())
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

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                    <h1 className="text-xl md:text-2xl font-bold text-gray-900">My Quotes</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all your generated quotes</p>
                </div>
                <Link href="/retailer/quotes/new">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" />
                        New Quote
                    </Button>
                </Link>
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
                                    <TableHead>Quote Number</TableHead>
                                    <TableHead>Customer</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotes.map((quote) => (
                                    <TableRow key={quote.id}>
                                        <TableCell className="font-medium text-gray-900">
                                            {quote.quoteNumber}
                                        </TableCell>
                                        <TableCell>
                                            <p className="font-medium text-gray-900">{quote.customerName}</p>
                                            <p className="text-sm text-gray-500">{quote.customerEmail}</p>
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {formatCurrency(Number(quote.total) || 0)}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className={statusColors[quote.status] || 'bg-gray-100'}>
                                                {quote.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-gray-500 text-sm">
                                            {formatDate(quote.createdAt)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Link href={`/retailer/quotes/${quote.id}`}>
                                                <Button variant="ghost" size="sm" className="text-blue-600 hover:text-blue-800 hover:bg-blue-50">
                                                    <FileText className="h-4 w-4 mr-2" />
                                                    View
                                                </Button>
                                            </Link>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        </div>
    )
}
