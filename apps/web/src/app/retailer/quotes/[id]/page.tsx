'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, CheckCircle, Send, Download, Tag, FileText, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { toast } from '@/components/ui/use-toast'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'

export default function RetailerQuoteDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = useSession()
    const [quote, setQuote] = useState<any>(null)
    const [retailer, setRetailer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // PDF Customization state
    const [pdfPref, setPdfPref] = useState<string>('NONE')
    const [headerText, setHeaderText] = useState('')
    const [footerContact, setFooterContact] = useState('')
    const [labelText, setLabelText] = useState('')
    const [includeLogo, setIncludeLogo] = useState(false)
    const [includeLabel, setIncludeLabel] = useState(false)
    const [debouncedHeaderText, setDebouncedHeaderText] = useState('')
    const [debouncedFooterContact, setDebouncedFooterContact] = useState('')
    const [debouncedLabelText, setDebouncedLabelText] = useState('')
    const [isCustomizationLocked, setIsCustomizationLocked] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedHeaderText(headerText)
            setDebouncedFooterContact(footerContact)
            setDebouncedLabelText(labelText)
        }, 500)
        return () => clearTimeout(timer)
    }, [headerText, footerContact, labelText])



    const fetchData = async () => {
        try {
            if (!session?.user?.retailerId) return;

            const [quoteRes, retailerRes] = await Promise.all([
                fetch(`/api/quotes/${params.id}`),
                fetch(`/api/retailers/${session.user.retailerId}`)
            ])
            if (quoteRes.ok) {
                const data = await quoteRes.json()
                setQuote(data)
                setIsCustomizationLocked(!!data.isCustomized)
            }


            if (retailerRes.ok) {
                const rData = await retailerRes.json()
                setRetailer(rData)
                // Initialize PDF customization based on Retailer settings
                setPdfPref(rData.pdfPreference || 'NONE')
                setHeaderText(rData.pdfCustomization?.headerText || rData.businessName || '')
                setFooterContact(rData.pdfCustomization?.footerContact || rData.email || '')
                setLabelText(rData.pdfCustomization?.labelText || '')
                setIncludeLogo(rData.pdfPreference !== 'NONE' && rData.pdfCustomization?.includeLogo !== false)
                setIncludeLabel(rData.pdfPreference !== 'NONE' && rData.pdfCustomization?.includeLabel !== false)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (session?.user?.retailerId) {
            fetchData()
        }
    }, [params.id, session?.user?.retailerId])

    useEffect(() => {
        const payment = searchParams.get('payment')
        const sessionId = searchParams.get('session_id')

        if (payment === 'success' && sessionId && quote?.id) {
            verifyPayment(sessionId, quote.id)
        }
    }, [searchParams, quote?.id])

    const verifyPayment = async (sessionId: string, quoteId: string) => {
        try {
            const res = await fetch('/api/checkout/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId, quoteId })
            })
            if (res.ok) {
                const data = await res.json()
                if (data.success) {
                    toast({ title: 'Payment Successful', description: 'Your payment was processed successfully!' })
                    fetchData()
                    // Remove query params
                    router.replace(`/retailer/quotes/${quoteId}`, undefined)
                }
            }
        } catch (error) {
            console.error('Failed to verify payment', error)
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
                fetchData()
            } else {
                toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
            }
        } catch (error) {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
        }
    }

    const handlePayment = async () => {
        try {
            const response = await fetch('/api/checkout/create-checkout-session', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    quoteId: quote.id,
                }),
            });

            const session = await response.json();

            if (!response.ok) {
                throw new Error(session?.error || 'Failed to create session');
            }

            // Handle mock session (your fallback)
            if (session.id?.startsWith("cs_test_mock")) {
                toast({
                    title: 'Mock Payment',
                    description: 'Payment successful (Mock)',
                });

                router.push(
                    `/retailer/quotes/${quote.id}?payment=success&session_id=${session.id}`
                );
                return;
            }

            // ✅ Modern Stripe way — direct redirect
            if (session.url) {
                window.location.href = session.url;
                return;
            }

            throw new Error("No checkout URL returned");

        } catch (error: any) {
            toast({
                title: 'Payment Error',
                description: error.message,
                variant: 'destructive',
            });
        }
    };


    const downloadPDF = () => {
        if (!quote) return;

        // Simply download the PDF without customization
        const link = document.createElement('a');
        link.href = `/api/quotes/${quote.id}/pdf`; // endpoint that serves the PDF
        link.download = `${quote.quoteNumber}.pdf`; // suggested filename
        link.click();
    }

    const downloadCustomPDF = async () => {
        if (isCustomizationLocked) {
            toast({
                title: "Customization Not Allowed",
                description: "You cannot customize this quote more than once.",
                variant: "destructive"
            })
            return
        }

        const confirmed = confirm(
            "⚠ IMPORTANT NOTICE\n\n" +
            "You can customize this quote only ONCE.\n\n" +
            "After generating the PDF:\n" +
            "• The customization will be permanently locked\n" +
            "• The data will be sent to Admin\n" +
            "• You will not be able to modify it again\n\n" +
            "Do you want to continue?"
        )

        if (!confirmed) return

        try {
            const res = await fetch(`/api/quotes/${quote.id}/customize`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    includeLogo,
                    includeLabel,
                    headerText,
                    footerContact,
                    labelText
                })
            })

            if (!res.ok) {
                toast({
                    title: "Error",
                    description: "Customization already used or failed.",
                    variant: "destructive"
                })
                return
            }

            setIsCustomizationLocked(true)

            // Refresh quote data to get the stored customization
            await fetchData()

            // Open finalized PDF
            window.open(`/api/quotes/${quote.id}/pdf`, '_blank')

            toast({
                title: "Customization Finalized",
                description: "Quote locked and sent to admin."
            })

        } catch (error) {
            toast({
                title: "Error",
                description: "Something went wrong.",
                variant: "destructive"
            })
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Quote Data...</div>
    if (!quote) return <div className="p-8 text-center">Quote not found</div>

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)
    }

    const isPerOrder = retailer?.pdfPreference === 'PER_ORDER'
    const isAlways = retailer?.pdfPreference === 'ALWAYS'

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 border rounded-xl shadow-sm">
                <div className="flex items-center gap-4">
                    <Link href="/retailer/quotes">
                        <Button variant="outline" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            {quote.quoteNumber}
                            <Badge className="bg-blue-100 text-blue-800 ml-2">{quote.status}</Badge>
                            {quote.paymentStatus === 'SUCCESS' && (
                                <Badge className="bg-green-100 text-green-800 ml-2">PAID</Badge>
                            )}
                        </h1>
                        <p className="text-gray-500 text-sm mt-1">Generated on {new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex gap-3">

                    <Button variant="outline" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>

                    {!isAlways && (
                        <Dialog>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isCustomizationLocked}
                                    className="border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <FileText className="w-4 h-4 mr-2" />
                                    Customize PDF
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[800px]">
                                {isCustomizationLocked && (
                                    <div className="text-red-600 text-sm font-medium px-4 py-2 bg-red-50 border border-red-200 rounded-lg">
                                        ⚠ You have already customized this quote.
                                        Further customization is not allowed and the data has been sent to admin.
                                    </div>
                                )}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                                    <div className="space-y-6">
                                        <div className="flex flex-col space-y-3 p-4 border rounded-lg bg-gray-50">
                                            <div className="flex items-start space-x-3 pb-2 border-b border-gray-200">
                                                <Checkbox
                                                    id="brand-logo"
                                                    checked={includeLogo}
                                                    onCheckedChange={(c) => setIncludeLogo(c as boolean)}
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="brand-logo" className="font-semibold cursor-pointer">Inject My Brand Logo</Label>
                                                    <p className="text-xs text-gray-500 font-normal">Embed your uploaded Logo into the final PDF.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-start space-x-3 pt-1">
                                                <Checkbox
                                                    id="brand-label"
                                                    checked={includeLabel}
                                                    onCheckedChange={(c) => setIncludeLabel(c as boolean)}
                                                />
                                                <div className="space-y-1">
                                                    <Label htmlFor="brand-label" className="font-semibold cursor-pointer">Inject Brand Label</Label>
                                                    <p className="text-xs text-gray-500 font-normal">Embed text indicators of your brand label.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4 pt-4 border-t">
                                            <div className="space-y-2">
                                                <Label>Brand Label Text</Label>
                                                <Input
                                                    value={labelText}
                                                    onChange={(e) => setLabelText(e.target.value)}
                                                    placeholder="[ BRAND LABEL APPLIED ]"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Business Header Name</Label>
                                                <Input
                                                    value={headerText}
                                                    onChange={(e) => setHeaderText(e.target.value)}
                                                    placeholder="Your business name to appear at the top"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Footer Contact Bar</Label>
                                                <Input
                                                    value={footerContact}
                                                    onChange={(e) => setFooterContact(e.target.value)}
                                                    placeholder="Website, Phone, or Legal tagline..."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col border rounded-lg overflow-hidden bg-gray-100 min-h-[400px]">
                                        <div className="bg-gray-200 p-2 text-xs font-semibold text-center text-gray-700 border-b">
                                            Live PDF Preview
                                        </div>
                                        <iframe
                                            src={`/api/quotes/${quote.id}/pdf?inline=true&pdfPreference=${includeLabel || includeLogo || isAlways ? 'ALWAYS' : 'NONE'}&includeLogo=${includeLogo}&includeLabel=${includeLabel}&headerText=${encodeURIComponent(debouncedHeaderText || '')}&footerContact=${encodeURIComponent(debouncedFooterContact || '')}&labelText=${encodeURIComponent(debouncedLabelText || '')}#toolbar=0&navpanes=0`}
                                            className="w-full h-full min-h-[400px]"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={downloadCustomPDF} className="w-full">
                                        <Download className="w-4 h-4 mr-2" /> Generate & Download
                                    </Button>
                                    <Button onClick={() => handlePayment()} className="w-full">
                                        <Tag className="w-4 h-4 mr-2" /> Pay for PDF Customization
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {quote.status === 'DRAFT' && (
                        <Button className="bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus('SENT')}>
                            <Send className="w-4 h-4 mr-2" /> Mark as Sent
                        </Button>
                    )}
                    {quote.status === 'SENT' && (
                        <Button className="bg-green-600 hover:bg-green-700" onClick={() => handleUpdateStatus('ACCEPTED')}>
                            <CheckCircle className="w-4 h-4 mr-2" /> Mark as Accepted
                        </Button>
                    )}
                    {quote.status === 'ACCEPTED' && quote.paymentStatus !== 'SUCCESS' && (
                        <Button className="bg-purple-600 hover:bg-purple-700" onClick={() => handlePayment()}>
                            <Tag className="w-4 h-4 mr-2" /> Pay Now
                        </Button>
                    )}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="col-span-2">
                    <CardHeader>
                        <CardTitle>Items ({quote.items?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {quote.items?.map((item: any) => (
                            <div key={item.id} className="p-4 border rounded-lg bg-gray-50 flex justify-between items-center">
                                <div>
                                    <h3 className="font-bold flex items-center gap-2">
                                        <Package className="w-4 h-4 text-gray-400" /> {item.productType} • {item.shape}
                                    </h3>
                                    <p className="text-sm text-gray-500 mt-1">
                                        Fabric: {item.fabricCode} | Fill: {item.foamType}
                                    </p>
                                    <p className="text-sm text-gray-500 mt-1">Qty: {item.quantity}</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-bold text-lg text-gray-900">{formatCurrency(item.totalPrice)}</p>
                                    <p className="text-sm text-gray-500">{formatCurrency(item.unitPrice)} ea</p>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Customer Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <strong className="text-gray-500 block mb-1">Name</strong>
                                <span className="font-medium">{quote.customerName}</span>
                            </div>
                            <div>
                                <strong className="text-gray-500 block mb-1">Email</strong>
                                <a href={`mailto:${quote.customerEmail}`} className="text-blue-600 hover:underline">{quote.customerEmail}</a>
                            </div>
                            {quote.customerPhone && (
                                <div>
                                    <strong className="text-gray-500 block mb-1">Phone</strong>
                                    <span>{quote.customerPhone}</span>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">Pricing Summary</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 text-sm">
                            <div className="flex justify-between border-b pb-3 text-gray-600">
                                <span>Subtotal Base</span>
                                <span className="font-medium text-gray-900">{formatCurrency(parseFloat(quote.subtotal))}</span>
                            </div>
                            {parseFloat(quote.markupAmount) > 0 && (
                                <div className="flex justify-between border-b pb-3 text-gray-600">
                                    <span>Retailer Margin Added</span>
                                    <span className="font-medium text-emerald-600">+{formatCurrency(parseFloat(quote.markupAmount))}</span>
                                </div>
                            )}

                            {(() => {
                                let fees = 0;
                                let pdfFee = 0;
                                let fabricFee = 0;
                                if (retailer?.pdfPreference === 'ALWAYS') {
                                    pdfFee = 10;
                                    fees += pdfFee;
                                }
                                if (retailer?.labelPreference === 'ALWAYS') {
                                    const qty = quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                                    fabricFee = 8 * qty;
                                    fees += fabricFee;
                                }

                                const parsedTotal = parseFloat(quote.total) || 0;

                                if (fees > 0) {
                                    return (
                                        <>
                                            {pdfFee > 0 && (
                                                <div className="flex justify-between border-b pb-3 text-gray-600">
                                                    <span>Brand Label (PDF)</span>
                                                    <span className="font-medium text-blue-600">+{formatCurrency(pdfFee)}</span>
                                                </div>
                                            )}
                                            {fabricFee > 0 && (
                                                <div className="flex justify-between border-b pb-3 text-gray-600">
                                                    <span>Brand Label (Fabric)</span>
                                                    <span className="font-medium text-blue-600">+{formatCurrency(fabricFee)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between pt-2">
                                                <span className="font-bold text-lg text-gray-900">Final Total</span>
                                                <span className="font-bold text-xl text-blue-600">{formatCurrency(parsedTotal + fees)}</span>
                                            </div>
                                        </>
                                    );
                                }

                                return (
                                    <div className="flex justify-between pt-2">
                                        <span className="font-bold text-lg text-gray-900">Final Total</span>
                                        <span className="font-bold text-xl text-blue-600">{formatCurrency(parsedTotal)}</span>
                                    </div>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
