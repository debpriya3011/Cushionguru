'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Send, Download, CreditCard, FileText, Package, CheckCircle2, Tag } from 'lucide-react'
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

const paymentStatusConfig: Record<string, { label: string; className: string }> = {
    PENDING: { label: 'Payment Pending', className: 'bg-gray-100 text-gray-600' },
    UNPAID: { label: 'Payment Pending', className: 'bg-gray-100 text-gray-600' },
    SUCCESS: { label: '✓ Paid', className: 'bg-green-100 text-green-700' },
    FAILED: { label: 'Payment Failed', className: 'bg-red-100 text-red-700' },
    REFUNDED: { label: 'Refunded', className: 'bg-orange-100 text-orange-700' },
}

// Simple native toggle switch (no Radix dependency, works perfectly on mobile/touch)
function Toggle({ checked, onChange, disabled = false }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            onClick={() => !disabled && onChange(!checked)}
            className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-blue-600' : 'bg-gray-300'}`}
        >
            <span
                className={`pointer-events-none inline-block h-6 w-6 rounded-full bg-white shadow-md transform transition-transform duration-200 ${checked ? 'translate-x-5' : 'translate-x-0'}`}
            />
        </button>
    )
}

// Native checkbox row for the PDF dialog
function CheckRow({ id, checked, onChange, disabled, label, description }: {
    id: string; checked: boolean; onChange: (v: boolean) => void; disabled: boolean; label: string; description: string
}) {
    return (
        <label
            htmlFor={id}
            className={`flex items-start gap-3 cursor-pointer select-none rounded-lg p-3 transition-colors ${checked ? 'bg-blue-50' : 'bg-white hover:bg-gray-50'} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}
        >
            <input
                id={id}
                type="checkbox"
                checked={checked}
                onChange={e => onChange(e.target.checked)}
                disabled={disabled}
                className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-blue-600 accent-blue-600 cursor-pointer"
            />
            <div className="space-y-0.5 min-w-0">
                <p className="text-sm font-semibold text-gray-800 leading-snug">{label}</p>
                <p className="text-xs text-gray-500 font-normal leading-relaxed">{description}</p>
            </div>
        </label>
    )
}

export default function RetailerQuoteDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const searchParams = useSearchParams()
    const { data: session } = useSession()
    const [quote, setQuote] = useState<any>(null)
    const [retailer, setRetailer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    // PDF Customization state
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

    // PER_ORDER label toggle — controls whether fabric label fee applies for this quote
    const [wantLabel, setWantLabel] = useState(false)
    const [savingLabelPref, setSavingLabelPref] = useState(false)

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
                // PER_ORDER: wantLabel = true if this quote's label pref is still PER_ORDER (opted in) or ALWAYS
                setWantLabel(data.labelPreference === 'ALWAYS' || data.labelPreference === 'PER_ORDER')
            }

            if (retailerRes.ok) {
                const rData = await retailerRes.json()
                setRetailer(rData)
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
        } catch {
            toast({ title: 'Error', description: 'Failed to update status', variant: 'destructive' })
        }
    }

    // Save label preference toggle for PER_ORDER quotes
    const handleToggleLabel = async (enabled: boolean) => {
        setWantLabel(enabled)
        if (!quote) return
        // For PER_ORDER: toggling OFF sets labelPreference=NONE for this quote, ON sets it back to PER_ORDER
        // For ALWAYS: this toggle is not shown
        setSavingLabelPref(true)
        try {
            const res = await fetch(`/api/quotes/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ labelPreference: enabled ? 'PER_ORDER' : 'NONE' })
            })
            if (res.ok) {
                await fetchData()
                toast({
                    title: enabled ? 'Label Added' : 'Label Removed',
                    description: enabled ? '+$8/cushion label fee added to this quote.' : 'Label fee removed from this quote.'
                })
            }
        } catch {
            toast({ title: 'Error', description: 'Failed to update label preference', variant: 'destructive' })
            setWantLabel(!enabled) // rollback
        } finally {
            setSavingLabelPref(false)
        }
    }

    const handlePayment = async () => {
        try {
            const response = await fetch('/api/checkout/create-checkout-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quoteId: quote.id }),
            })
            const session = await response.json()
            if (!response.ok) throw new Error(session?.error || 'Failed to create session')
            if (session.id?.startsWith("cs_test_mock")) {
                toast({ title: 'Mock Payment', description: 'Payment successful (Mock)' })
                router.push(`/retailer/quotes/${quote.id}?payment=success&session_id=${session.id}`)
                return
            }
            if (session.url) { window.location.href = session.url; return }
            throw new Error("No checkout URL returned")
        } catch (error: any) {
            toast({ title: 'Payment Error', description: error.message, variant: 'destructive' })
        }
    }

    const downloadPDF = async () => {
        if (!quote) return
        const link = document.createElement('a')
        link.href = `/api/quotes/${quote.id}/pdf`
        link.download = `${quote.quoteNumber}.pdf`
        link.click()
        if (quote.status === 'DRAFT') {
            await handleUpdateStatus('SENT')
        }
    }

    const downloadCustomPDF = async () => {
        if (isCustomizationLocked) {
            toast({ title: "Customization Not Allowed", description: "You cannot customize this quote more than once.", variant: "destructive" })
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
                body: JSON.stringify({ includeLogo, includeLabel, headerText, footerContact, labelText })
            })
            if (!res.ok) {
                toast({ title: "Error", description: "Customization already used or failed.", variant: "destructive" })
                return
            }
            setIsCustomizationLocked(true)
            await fetchData()
            window.open(`/api/quotes/${quote.id}/pdf`, '_blank')
            toast({ title: "Customization Finalized", description: "Quote locked, PDF generated, and marked as Sent." })
        } catch {
            toast({ title: "Error", description: "Something went wrong.", variant: "destructive" })
        }
    }

    const downloadLabelPack = async () => {
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
            toast({ title: 'Downloaded', description: 'Label pack downloaded successfully.' })
        } catch {
            toast({ title: 'Download Failed', description: 'Could not download label pack.', variant: 'destructive' })
        }
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading Quote Data...</div>
    if (!quote) return <div className="p-8 text-center">Quote not found</div>

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount)

    const isAlways = quote.pdfPreference === 'ALWAYS'
    const isLabelAlways = quote.labelPreference === 'ALWAYS'
    const isLabelPerOrder = retailer?.labelPreference === 'PER_ORDER' // based on retailer setting (PER_ORDER)
    // Show label toggle when retailer setting is PER_ORDER AND quote hasn't been paid yet
    const showLabelToggle = isLabelPerOrder && quote.paymentStatus !== 'SUCCESS'
    const hasLabelSetup = (quote.labelPreference === 'ALWAYS' || quote.labelPreference === 'PER_ORDER') && retailer?.labelFileUrl
    const pmtConfig = paymentStatusConfig[quote.paymentStatus] || paymentStatusConfig.PENDING
    const isPaid = quote.paymentStatus === 'SUCCESS'

    // ── Fee computation (single source of truth for this page) ──
    const baseTotal = parseFloat(quote.total?.toString() || '0')

    let pdfFee = 0
    if (quote.pdfPreference === 'ALWAYS') { pdfFee = 10 }
    else if (quote.isCustomized) { pdfFee = 10 }
    else if (quote.status === 'DRAFT') { pdfFee = wantCustomPdf ? 10 : 0 }

    let fabricFee = 0
    if (!isPaid) {
        if (isLabelAlways) {
            // ALWAYS: always add $8/cushion
            const qty = quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0
            fabricFee = 8 * qty
        } else if (quote.labelPreference === 'PER_ORDER' && wantLabel) {
            // PER_ORDER: add only if wantLabel toggle is on
            const qty = quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0
            fabricFee = 8 * qty
        }
    }

    const grandTotal = baseTotal + pdfFee + fabricFee

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 sm:p-6 border rounded-xl shadow-sm gap-4">
                <div className="flex items-start gap-3 sm:gap-4">
                    <Link href="/retailer/quotes">
                        <Button variant="outline" size="icon" className="shrink-0 mt-0.5"><ArrowLeft className="h-4 w-4" /></Button>
                    </Link>
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex flex-wrap items-center gap-2">
                            {quote.quoteNumber}
                            <Badge className="bg-blue-100 text-blue-800">{quote.status}</Badge>
                            <Badge className={pmtConfig.className}>{pmtConfig.label}</Badge>
                        </h1>
                        <p className="text-gray-500 text-xs sm:text-sm mt-1">Generated on {new Date(quote.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>

                <div className="flex flex-col sm:flex-row flex-wrap gap-2 w-full md:w-auto">
                    <Button variant="outline" className="w-full sm:w-auto" onClick={downloadPDF}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>

                    {hasLabelSetup && (
                        <Button variant="outline" className="w-full sm:w-auto border-purple-200 text-purple-700 hover:bg-purple-50" onClick={downloadLabelPack}>
                            <Download className="w-4 h-4 mr-2" /> Label Pack
                        </Button>
                    )}

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

                            {/* ─── Fully Mobile-Responsive Dialog ─── */}
                            <DialogContent className="w-[calc(100vw-1rem)] max-w-3xl max-h-[92dvh] overflow-y-auto p-4 sm:p-6 rounded-xl">
                                <DialogHeader className="mb-3">
                                    <DialogTitle className="text-lg">Customize PDF</DialogTitle>
                                    <DialogDescription>Add your branding to this quote's PDF.</DialogDescription>
                                </DialogHeader>

                                {isCustomizationLocked && (
                                    <div className="text-red-600 text-sm font-medium px-3 py-2 bg-red-50 border border-red-200 rounded-lg mb-3">
                                        ⚠ You have already customized this quote. No further changes allowed.
                                    </div>
                                )}

                                {/* Fee banner */}
                                <div className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl border mb-4 ${wantCustomPdf ? 'bg-amber-50 border-amber-200' : 'bg-gray-50 border-gray-200'}`}>
                                    <div className="min-w-0">
                                        {wantCustomPdf ? (
                                            <p className="text-sm font-semibold text-amber-800">📄 PDF Customization Fee: <span className="text-amber-600">+$10.00</span></p>
                                        ) : (
                                            <p className="text-sm font-medium text-gray-500">Skipped — no extra fee.</p>
                                        )}
                                        <p className="text-xs text-gray-400 mt-0.5">{wantCustomPdf ? 'Toggle off to skip branding.' : 'Toggle on to add branding for $10.'}</p>
                                    </div>
                                    <Toggle checked={wantCustomPdf} onChange={setWantCustomPdf} />
                                </div>

                                {/* Options + Preview */}
                                <div className={`space-y-4 ${!wantCustomPdf ? 'opacity-40 pointer-events-none select-none' : ''}`}>
                                    {/* Checkbox options */}
                                    <div className="border rounded-xl overflow-hidden divide-y bg-white">
                                        <CheckRow
                                            id="brand-logo"
                                            checked={includeLogo}
                                            onChange={setIncludeLogo}
                                            disabled={!wantCustomPdf}
                                            label="Inject My Brand Logo"
                                            description="Embed your uploaded logo into the final PDF."
                                        />
                                        <CheckRow
                                            id="brand-label"
                                            checked={includeLabel}
                                            onChange={setIncludeLabel}
                                            disabled={!wantCustomPdf}
                                            label="Inject Brand Label Text"
                                            description="Embed text indicators of your brand label."
                                        />
                                    </div>

                                    {/* Text inputs */}
                                    <div className="space-y-3 p-4 bg-gray-50 rounded-xl border">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium">Brand Label Text</Label>
                                            <Input value={labelText} onChange={e => setLabelText(e.target.value)} placeholder="[ BRAND LABEL APPLIED ]" disabled={!wantCustomPdf} className="bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium">Business Header Name</Label>
                                            <Input value={headerText} onChange={e => setHeaderText(e.target.value)} placeholder="Your business name at the top" disabled={!wantCustomPdf} className="bg-white" />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-medium">Footer Contact Bar</Label>
                                            <Input value={footerContact} onChange={e => setFooterContact(e.target.value)} placeholder="Website, Phone, or Legal tagline..." disabled={!wantCustomPdf} className="bg-white" />
                                        </div>
                                    </div>

                                    {/* PDF preview — only on desktop */}
                                    <div className="hidden md:block border rounded-xl overflow-hidden bg-gray-100">
                                        <div className="bg-gray-200 p-2 text-xs font-semibold text-center text-gray-700 border-b">Live PDF Preview</div>
                                        <iframe
                                            src={`/api/quotes/${quote.id}/pdf?inline=true&pdfPreference=${wantCustomPdf && (includeLabel || includeLogo || isAlways) ? 'ALWAYS' : 'NONE'}&includeLogo=${wantCustomPdf && includeLogo}&includeLabel=${wantCustomPdf && includeLabel}&headerText=${encodeURIComponent(wantCustomPdf ? (debouncedHeaderText || '') : '')}&footerContact=${encodeURIComponent(wantCustomPdf ? (debouncedFooterContact || '') : '')}&labelText=${encodeURIComponent(wantCustomPdf ? (debouncedLabelText || '') : '')}#toolbar=0&navpanes=0`}
                                            className="w-full min-h-[320px]"
                                        />
                                    </div>
                                </div>

                                <DialogFooter className="mt-4 pt-3 border-t">
                                    <Button onClick={wantCustomPdf ? downloadCustomPDF : downloadPDF} className="w-full h-11 text-base">
                                        <Download className="w-4 h-4 mr-2" />
                                        {wantCustomPdf ? 'Generate & Download (Final)' : 'Download Plain PDF'}
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    )}

                    {quote.status === 'DRAFT' && (
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700" onClick={() => handleUpdateStatus('SENT')}>
                            <Send className="w-4 h-4 mr-2 shrink-0" /> Mark as Sent
                        </Button>
                    )}
                    {quote.status === 'ACCEPTED' && !isPaid && (
                        <Button className="w-full sm:w-auto bg-purple-600 hover:bg-purple-700" onClick={() => handlePayment()}>
                            <CreditCard className="w-4 h-4 mr-2 shrink-0" /> Pay Now
                        </Button>
                    )}
                </div>
            </div>

            {/* PER_ORDER label toggle — shown as a prominent banner when applicable */}
            {showLabelToggle && (
                <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border-2 transition-colors ${wantLabel ? 'bg-purple-50 border-purple-200' : 'bg-gray-50 border-gray-200'}`}>
                    <div className="flex items-start gap-3">
                        <Tag className={`w-5 h-5 mt-0.5 shrink-0 ${wantLabel ? 'text-purple-600' : 'text-gray-400'}`} />
                        <div>
                            <p className={`text-sm font-semibold ${wantLabel ? 'text-purple-800' : 'text-gray-700'}`}>
                                Brand Label Stitching {wantLabel ? '— Added' : '— Not included'}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {wantLabel
                                    ? `+$8 × ${quote.items?.reduce((acc: number, item: any) => acc + item.quantity, 0) || 0} cushion(s) = ${formatCurrency(fabricFee)} added to total`
                                    : 'Toggle ON to include brand label stitching (+$8/cushion) for this quote.'}
                            </p>
                        </div>
                    </div>
                    <Toggle
                        checked={wantLabel}
                        onChange={handleToggleLabel}
                        disabled={savingLabelPref}
                    />
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
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
                                        <div className="flex-1">
                                            <h3 className="font-bold flex items-center gap-2 text-base sm:text-lg leading-tight">
                                                <Package className="w-4 h-4 text-gray-400 shrink-0" />
                                                <span className="break-words">{item.productType} • {item.shape}</span>
                                            </h3>
                                        </div>
                                        <div className="text-left sm:text-right shrink-0">
                                            <p className="font-bold text-base sm:text-lg text-gray-900">{formatCurrency(item.totalPrice)}</p>
                                            <p className="text-xs sm:text-sm text-gray-500">{formatCurrency(item.unitPrice)} ea</p>
                                        </div>
                                    </div>
                                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-600">
                                        {dimParts.length > 0 && (
                                            <div className="col-span-1 sm:col-span-2">
                                                <span className="text-gray-400 font-medium">Dimensions:</span>{' '}
                                                <span className="text-gray-900 font-medium break-words">{dimParts.join(' × ')}</span>
                                            </div>
                                        )}
                                        <div><span className="text-gray-400 font-medium">Foam/Fill:</span>{' '}<span className="text-gray-700">{item.foamType}</span></div>
                                        <div><span className="text-gray-400 font-medium">Fabric:</span>{' '}<span className="text-gray-700">{item.fabricCode}{item.fabricName ? ` (${item.fabricName})` : ''}</span></div>
                                        <div><span className="text-gray-400 font-medium">Zipper:</span>{' '}<span className="text-gray-700">{item.zipperPosition}</span></div>
                                        <div><span className="text-gray-400 font-medium">Piping:</span>{' '}<span className="text-gray-700">{item.piping}</span></div>
                                        <div><span className="text-gray-400 font-medium">Ties:</span>{' '}<span className="text-gray-700">{item.ties}</span></div>
                                        <div><span className="text-gray-400 font-medium">Quantity:</span>{' '}<span className="text-gray-700">{item.quantity}</span></div>
                                    </div>
                                </div>
                            )
                        })}
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card>
                        <CardHeader><CardTitle className="text-base">Customer Details</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div>
                                <strong className="text-gray-500 block mb-1">Name</strong>
                                <span className="font-medium">{quote.customerName}</span>
                            </div>
                            <div>
                                <strong className="text-gray-500 block mb-1">Email</strong>
                                <a href={`mailto:${quote.customerEmail}`} className="text-blue-600 hover:underline break-all">{quote.customerEmail}</a>
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
                        <CardHeader><CardTitle className="text-base">Pricing Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-3 text-sm">
                            <div className="flex justify-between border-b pb-3 text-gray-600">
                                <span>Subtotal Base</span>
                                <span className="font-medium text-gray-900">{formatCurrency(parseFloat(quote.subtotal))}</span>
                            </div>
                            {parseFloat(quote.markupAmount) > 0 && (
                                <div className="flex justify-between border-b pb-3 text-gray-600">
                                    <span>Retailer Margin</span>
                                    <span className="font-medium text-emerald-600">+{formatCurrency(parseFloat(quote.markupAmount))}</span>
                                </div>
                            )}
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
                                    <span className="font-medium text-purple-600">+{formatCurrency(fabricFee)}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-2">
                                <span className="font-bold text-lg text-gray-900">Final Total</span>
                                <span className="font-bold text-xl text-blue-600">{formatCurrency(grandTotal)}</span>
                            </div>

                            {/* Payment status */}
                            <div className={`mt-1 p-3 rounded-xl border ${isPaid ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-medium text-gray-700">Payment Status</span>
                                    <Badge className={pmtConfig.className}>{pmtConfig.label}</Badge>
                                </div>
                                {isPaid && (
                                    <div className="flex items-center justify-between mt-2 text-sm text-green-700">
                                        <span className="flex items-center gap-1">
                                            <CheckCircle2 className="w-4 h-4" /> Amount Paid
                                        </span>
                                        <span className="font-bold">{formatCurrency(grandTotal)}</span>
                                    </div>
                                )}
                                {quote.paymentDate && isPaid && (
                                    <p className="text-xs text-gray-400 mt-1">Paid on {new Date(quote.paymentDate).toLocaleDateString()}</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
