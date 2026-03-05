'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { ArrowLeft, Send, Download, CreditCard, FileText, Package } from 'lucide-react'
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
    const [wantCustomPdf, setWantCustomPdf] = useState(true)

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


    const downloadPDF = async () => {
        if (!quote) return;

        // Trigger the plain PDF download
        const link = document.createElement('a');
        link.href = `/api/quotes/${quote.id}/pdf`;
        link.download = `${quote.quoteNumber}.pdf`;
        link.click();

        // Auto-mark as SENT when PDF is downloaded in DRAFT stage
        if (quote.status === 'DRAFT') {
            await handleUpdateStatus('SENT');
        }
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

            // Refresh quote data (customize API has already set status=SENT and total+=10)
            await fetchData()

            // Open finalized PDF
            window.open(`/api/quotes/${quote.id}/pdf`, '_blank')

            toast({
                title: "Customization Finalized",
                description: "Quote locked, PDF generated, and marked as Sent."
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

    const isAlways = quote.pdfPreference === 'ALWAYS'

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-6 border rounded-xl shadow-sm gap-4">
                <div className="flex items-center gap-3 sm:gap-4">
                    <Link href="/retailer/quotes">
                        <Button variant="outline" size="icon" className="shrink-0"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2 sm:gap-3">
                            {quote.quoteNumber}
                            <Badge className="bg-blue-100 text-blue-800 ml-0 sm:ml-2">{quote.status}</Badge>
                            {quote.paymentStatus === 'SUCCESS' && (
                                <Badge className="bg-green-100 text-green-800">PAID</Badge>
                            )}
                        </h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Generated on {new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full md:w-auto mt-2 md:mt-0">

                    <Button variant="outline" className="w-full sm:w-auto" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>

                    {!isAlways && (
                        <Dialog onOpenChange={(open) => { if (open) setWantCustomPdf(true) }}>
                            <DialogTrigger asChild>
                                <Button
                                    variant="outline"
                                    disabled={isCustomizationLocked || quote.status !== 'DRAFT'}
                                    className="w-full sm:w-auto border-blue-200 text-blue-700 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    title={quote.status !== 'DRAFT' ? 'PDF customization is only allowed while quote is in DRAFT status' : undefined}
                                >
                                    <FileText className="w-4 h-4 mr-2 shrink-0" />
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

                                {/* $10 fee notice + opt-out toggle */}
                                <div className={`flex items-center justify-between px-4 py-3 rounded-lg border ${wantCustomPdf
                                    ? 'bg-amber-50 border-amber-200'
                                    : 'bg-gray-50 border-gray-200'
                                    }`}>
                                    <div>
                                        {wantCustomPdf ? (
                                            <p className="text-sm font-semibold text-amber-800">
                                                📄 PDF Customization Fee: <span className="text-amber-600">+$10.00</span>
                                            </p>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-500">
                                                PDF customization skipped — no extra fee.
                                            </p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {wantCustomPdf ? 'Toggle off to skip branding and save $10.' : 'Toggle on to add your branding for $10.'}
                                        </p>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setWantCustomPdf(v => !v)}
                                        className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus:outline-none ${wantCustomPdf ? 'bg-amber-500' : 'bg-gray-300'
                                            }`}
                                        aria-label="Toggle PDF customization"
                                    >
                                        <span className={`pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform transition-transform ${wantCustomPdf ? 'translate-x-5' : 'translate-x-0'
                                            }`} />
                                    </button>
                                </div>

                                <div className={`grid grid-cols-1 md:grid-cols-2 gap-6 py-4 ${!wantCustomPdf ? 'opacity-40 pointer-events-none select-none' : ''
                                    }`}>
                                    <div className="space-y-6">
                                        <div className="flex flex-col space-y-3 p-4 border rounded-lg bg-gray-50">
                                            <div className="flex items-start space-x-3 pb-2 border-b border-gray-200">
                                                <Checkbox
                                                    id="brand-logo"
                                                    checked={includeLogo}
                                                    disabled={!wantCustomPdf}
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
                                                    disabled={!wantCustomPdf}
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
                                                    disabled={!wantCustomPdf}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Business Header Name</Label>
                                                <Input
                                                    value={headerText}
                                                    onChange={(e) => setHeaderText(e.target.value)}
                                                    placeholder="Your business name to appear at the top"
                                                    disabled={!wantCustomPdf}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Footer Contact Bar</Label>
                                                <Input
                                                    value={footerContact}
                                                    onChange={(e) => setFooterContact(e.target.value)}
                                                    placeholder="Website, Phone, or Legal tagline..."
                                                    disabled={!wantCustomPdf}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex flex-col border rounded-lg overflow-hidden bg-gray-100 min-h-[400px]">
                                        <div className="bg-gray-200 p-2 text-xs font-semibold text-center text-gray-700 border-b">
                                            Live PDF Preview
                                        </div>
                                        <iframe
                                            src={`/api/quotes/${quote.id}/pdf?inline=true&pdfPreference=${wantCustomPdf && (includeLabel || includeLogo || isAlways) ? 'ALWAYS' : 'NONE'}&includeLogo=${wantCustomPdf && includeLogo}&includeLabel=${wantCustomPdf && includeLabel}&headerText=${encodeURIComponent(wantCustomPdf ? (debouncedHeaderText || '') : '')}&footerContact=${encodeURIComponent(wantCustomPdf ? (debouncedFooterContact || '') : '')}&labelText=${encodeURIComponent(wantCustomPdf ? (debouncedLabelText || '') : '')}#toolbar=0&navpanes=0`}
                                            className="w-full h-full min-h-[400px]"
                                        />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        onClick={wantCustomPdf ? downloadCustomPDF : downloadPDF}
                                        className="w-full"
                                    >
                                        <Download className="w-4 h-4 mr-2" />
                                        {wantCustomPdf ? 'Generate & Download (Final)' : 'Download Plain PDF'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {quote.status === 'DRAFT' && (
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 mt-2 sm:mt-0" onClick={() => handleUpdateStatus('SENT')}>
                            <Send className="w-4 h-4 mr-2 shrink-0" /> Mark as Sent
                        </Button>
                    )}
                    {quote.status === 'ACCEPTED' && quote.paymentStatus !== 'SUCCESS' && (
                        <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700 mt-2 sm:mt-0" onClick={() => handlePayment()}>
                            <CreditCard className="w-4 h-4 mr-2 shrink-0" /> Pay Now
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
                        {quote.items?.map((item: any) => {
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
                                        <div className="flex-1 w-full sm:w-auto">
                                            <h3 className="font-bold flex items-center gap-2 text-base sm:text-lg leading-tight break-words">
                                                <Package className="w-4 h-4 text-gray-400 shrink-0" /> <span className="truncate-mobile sm:truncate-none">{item.productType} • {item.shape}</span>
                                            </h3>
                                        </div>
                                        <div className="text-left sm:text-right mt-1 sm:mt-0 shrink-0">
                                            <p className="font-bold text-base sm:text-lg text-gray-900">{formatCurrency(item.totalPrice)}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">{formatCurrency(item.unitPrice)} ea</p>
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
                                // ─── Fee Rules ─────────────────────────────────────────────
                                // quote.total (DB) = subtotal + retailer markup — NEVER changes.
                                // pdfFee and fabricFee are computed add-ons shown on top.
                                //
                                // PDF fee ($10):
                                //   • pdfPreference ALWAYS → always $10
                                //   • DRAFT + not yet locked → live toggle (wantCustomPdf)
                                //   • After DRAFT → frozen: $10 if isCustomized, $0 if plain download
                                //
                                // Fabric label fee ($8/qty):
                                //   • labelPreference ALWAYS AND status DRAFT AND not yet paid
                                // ────────────────────────────────────────────────────────────

                                let pdfFee = 0;
                                if (quote.pdfPreference === 'ALWAYS') {
                                    pdfFee = 10;
                                } else if (quote.isCustomized) {
                                    // Locked after customized PDF was downloaded
                                    pdfFee = 10;
                                } else if (quote.status === 'DRAFT') {
                                    // Live toggle — user can see the cost change in real-time
                                    pdfFee = wantCustomPdf ? 10 : 0;
                                }
                                // If status is SENT and NOT isCustomized → plain PDF downloaded → $0

                                let fabricFee = 0;
                                if (
                                    quote.labelPreference === 'ALWAYS' &&
                                    quote.paymentStatus !== 'SUCCESS'
                                ) {
                                    const qty = quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0;
                                    fabricFee = 8 * qty;
                                }

                                const baseTotal = parseFloat(quote.total?.toString() || '0');
                                const grandTotal = baseTotal + pdfFee + fabricFee;

                                return (
                                    <>
                                        {pdfFee > 0 && (
                                            <div className="flex justify-between border-b pb-3 text-gray-600">
                                                <span className="flex items-center gap-1">
                                                    PDF Customization Fee
                                                    {quote.status === 'DRAFT' && !quote.isCustomized && (
                                                        <span className="text-xs text-amber-500 ml-1">(preview)</span>
                                                    )}
                                                </span>
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
                                            <span className="font-bold text-xl text-blue-600">{formatCurrency(grandTotal)}</span>
                                        </div>
                                    </>
                                );
                            })()}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
