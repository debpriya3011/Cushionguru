'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, CheckCircle, Store, Send, ShoppingCart, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'

export default function AdminQuoteDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const [quote, setQuote] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchQuote()
    }, [params.id])

    const fetchQuote = async () => {
        try {
            const res = await fetch(`/api/quotes/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setQuote(data)
            }
        } catch (error) {
            console.error('Failed to fetch quote:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateStatus = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/quotes/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            })

            if (res.ok) {
                toast({ title: 'Success', description: `Quote status updated to ${newStatus}` })
                fetchQuote()
            } else {
                toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
        }
    }

    if (loading) return <div className="p-8 text-center">Loading...</div>
    if (!quote) return <div className="p-8 text-center">Quote not found</div>

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/admin/quotes">
                        <Button variant="outline" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2 sm:gap-3">
                            {quote.quoteNumber} <Badge className="ml-0 sm:ml-2">{quote.status}</Badge>
                        </h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Created on {new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={() => window.open(`/api/quotes/${quote.id}/pdf`, '_blank')}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    {quote.status !== 'ACCEPTED' && quote.status !== 'CONVERTED' && (
                        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-700 mt-2 sm:mt-0" onClick={() => handleUpdateStatus('ACCEPTED')}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Approve Quote
                        </Button>
                    )}
                    {(quote.status === 'ACCEPTED') && (
                        <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0" onClick={() => handleUpdateStatus('CONVERTED')}>
                            <ShoppingCart className="w-4 h-4 mr-2" /> Convert to Order
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Hardware & Materials ({quote.items?.length || 0} items)</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {quote.items?.map((item: any, i: number) => {
                            const dims = item.dimensions || {}
                            const dimParts: string[] = []
                            if (dims.length) dimParts.push(`L: ${dims.length}"`)
                            if (dims.width) dimParts.push(`W: ${dims.width}"`)
                            if (dims.thickness) dimParts.push(`T: ${dims.thickness}"`)
                            if (dims.diameter) dimParts.push(`Dia: ${dims.diameter}"`)
                            if (dims.bottomWidth) dimParts.push(`Bottom W: ${dims.bottomWidth}"`)
                            if (dims.topWidth) dimParts.push(`Top W: ${dims.topWidth}"`)
                            if (dims.ear) dimParts.push(`Ear: ${dims.ear}"`)

                            return (
                                <div key={item.id} className="p-4 border rounded-lg bg-gray-50">
                                    <div className="flex flex-col sm:flex-row justify-between items-start gap-2">
                                        <div className="w-full sm:w-auto">
                                            <h3 className="font-bold text-base sm:text-lg leading-tight break-words">{item.productType} • {item.shape}</h3>
                                        </div>
                                        <div className="text-left sm:text-right mt-1 sm:mt-0 shrink-0">
                                            <p className="text-xs sm:text-sm font-semibold text-gray-400">Retailer Map: {formatCurrency(item.totalPrice)}</p>
                                            <p className="text-base sm:text-lg font-bold text-blue-800">Base Cost: {formatCurrency(item.baseSubtotal)}</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                                        {dimParts.length > 0 && (
                                            <div className="col-span-1 sm:col-span-2">
                                                <span className="text-gray-400 font-medium">Dimensions:</span>{' '}
                                                <span className="text-gray-900 font-medium break-words leading-relaxed">{dimParts.join(' × ')}</span>
                                            </div>
                                        )}
                                        <div>
                                            <span className="text-gray-400 font-medium">Foam/Fill:</span>{' '}
                                            <span className="text-gray-700">{item.foamType}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-medium">Fabric:</span>{' '}
                                            <span className="text-gray-700">{item.fabricCode}{item.fabricName ? ` (${item.fabricName})` : ''}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-medium">Zipper:</span>{' '}
                                            <span className="text-gray-700">{item.zipperPosition}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-medium">Piping:</span>{' '}
                                            <span className="text-gray-700">{item.piping}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-medium">Ties:</span>{' '}
                                            <span className="text-gray-700">{item.ties}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-400 font-medium">Quantity:</span>{' '}
                                            <span className="text-gray-700">{item.quantity}</span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2 text-gray-700"><Store className="w-4 h-4" /> Retailer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2 text-sm">
                            <p className="font-semibold text-gray-900 border-b pb-2 mb-2">{quote.retailer?.businessName}</p>
                            <p><strong>Customer:</strong> {quote.customerName}</p>
                            <p><strong>Email:</strong> {quote.customerEmail}</p>
                            {quote.customerPhone && <p><strong>Phone:</strong> {quote.customerPhone}</p>}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Financial Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(() => {
                                const subtotal = parseFloat(quote.subtotal?.toString() || '0')
                                const markup = parseFloat(quote.markupAmount?.toString() || '0')
                                const baseTotal = parseFloat(quote.total?.toString() || '0')

                                // PDF fee — uses quote's snapshotted pdfPreference (immune to settings changes)
                                let pdfFee = 0
                                if (quote.pdfPreference === 'ALWAYS') {
                                    pdfFee = 10
                                } else if (quote.isCustomized) {
                                    pdfFee = 10
                                }

                                // Fabric label fee — uses quote's snapshotted labelPreference
                                let fabricFee = 0
                                if (
                                    quote.labelPreference === 'ALWAYS' &&
                                    quote.paymentStatus !== 'SUCCESS'
                                ) {
                                    const qty = quote.items?.reduce((i: any, item: any) => i + item.quantity, 0) || 0
                                    fabricFee = 8 * qty
                                }

                                const grandTotal = baseTotal + pdfFee + fabricFee

                                return (
                                    <>
                                        <div className="flex justify-between border-b pb-3 text-gray-600 text-sm">
                                            <span>Subtotal (Base Cost)</span>
                                            <span className="font-medium text-blue-700">{formatCurrency(subtotal)}</span>
                                        </div>
                                        {markup > 0 && (
                                            <div className="flex justify-between border-b pb-3 text-gray-600 text-sm">
                                                <span>Retailer Margin</span>
                                                <span className="font-medium text-emerald-600">+{formatCurrency(markup)}</span>
                                            </div>
                                        )}
                                        {pdfFee > 0 && (
                                            <div className="flex justify-between border-b pb-3 text-gray-600 text-sm">
                                                <span>PDF Customization</span>
                                                <span className="font-medium text-blue-600">+{formatCurrency(pdfFee)}</span>
                                            </div>
                                        )}
                                        {fabricFee > 0 && (
                                            <div className="flex justify-between border-b pb-3 text-gray-600 text-sm">
                                                <span>Brand Label (Fabric)</span>
                                                <span className="font-medium text-blue-600">+{formatCurrency(fabricFee)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-1">
                                            <span className="font-bold text-lg">Total to Customer</span>
                                            <span className="font-bold text-lg text-green-700">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </>
                                )
                            })()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
