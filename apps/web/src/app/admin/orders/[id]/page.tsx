'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Truck, CheckCircle2, Box, Package, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { toast } from '@/components/ui/use-toast'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const STATUS_STEPS = [
    { value: 'PENDING', label: 'Order Received', icon: Box },
    { value: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
    { value: 'IN_PRODUCTION', label: 'In Production', icon: Package },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck },
    { value: 'DELIVERED', label: 'Delivered', icon: MapPin },
]

export default function AdminOrderDetailsPage() {
    const params = useParams()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [estimatedDate, setEstimatedDate] = useState('')
    const [trackingNumber, setTrackingNumber] = useState('')

    const fetchOrder = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}`)
            if (res.ok) {
                const data = await res.json()
                setOrder(data)
                setEstimatedDate(data.estimatedDeliveryDate ? new Date(data.estimatedDeliveryDate).toISOString().split('T')[0] : '')
                setTrackingNumber(data.shippingTrackingNumber || '')
            }
        } catch (error) {
            console.error(error)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (params.id) fetchOrder()
    }, [params.id])

    const handleStatusUpdate = async (newStatus: string) => {
        try {
            const res = await fetch(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus })
            })
            if (res.ok) {
                toast({ title: 'Status Updated', description: 'The retailer has been notified automatically.' })
                fetchOrder()
            }
        } catch (e: any) {
            toast({ title: 'Error', variant: 'destructive', description: e.message })
        }
    }

    const saveShippingDetails = async () => {
        try {
            const res = await fetch(`/api/orders/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    estimatedDeliveryDate: estimatedDate,
                    shippingTrackingNumber: trackingNumber
                })
            })
            if (res.ok) {
                toast({ title: 'Shipping Details Saved' })
                fetchOrder()
            }
        } catch (e: any) {
            toast({ title: 'Error', variant: 'destructive', description: e.message })
        }
    }

    if (loading || !order) return <div className="p-10 text-center text-gray-400">Loading Order Tracking...</div>

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.value === order.status)

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/orders">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order {order.orderNumber}
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            From Retailer: {order.retailer?.businessName}
                        </p>
                    </div>
                </div>
                <div className="bg-white px-4 py-2 border rounded-lg shadow-sm">
                    <span className="text-sm font-medium text-gray-500 mr-2">Status:</span>
                    <Badge variant="secondary" className="bg-blue-100 text-blue-800">{order.status}</Badge>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Delivery Tracking Timeline</CardTitle>
                            <CardDescription>Update status to automatically notify the retailer.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="relative border-l-2 border-gray-100 ml-3 pl-8 py-2 space-y-8">
                                {STATUS_STEPS.map((step, idx) => {
                                    const isCompleted = idx <= currentStepIndex;
                                    const isCurrent = idx === currentStepIndex;
                                    const Icon = step.icon;

                                    return (
                                        <div key={step.value} className="relative">
                                            <div className={`absolute -left-[41px] top-1 p-1 rounded-full border-2 bg-white ${isCompleted ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-300'}`}>
                                                <Icon className="w-4 h-4" />
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <h4 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                                                    <p className="text-sm text-gray-500 mt-1">
                                                        {isCurrent ? "Currently in this phase." : isCompleted ? "Completed step." : "Pending"}
                                                    </p>
                                                </div>
                                                {!isCompleted && idx === currentStepIndex + 1 && (
                                                    <Button size="sm" onClick={() => handleStatusUpdate(step.value)}>
                                                        Mark as {step.label}
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>

                            <div className="mt-8 pt-6 border-t flex items-center gap-4">
                                <Label className="whitespace-nowrap">Jump to specific status:</Label>
                                <Select value={order.status} onValueChange={handleStatusUpdate}>
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {STATUS_STEPS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                                        <SelectItem value="CANCELLED">Cancelled</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Shipping & Estimates</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Estimated Delivery Date</Label>
                                    <Input
                                        type="date"
                                        value={estimatedDate}
                                        onChange={(e) => setEstimatedDate(e.target.value)}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Carrier Tracking Number</Label>
                                    <Input
                                        type="text"
                                        placeholder="FedEx or UPS Tracking..."
                                        value={trackingNumber}
                                        onChange={(e) => setTrackingNumber(e.target.value)}
                                    />
                                </div>
                            </div>
                            <Button variant="secondary" onClick={saveShippingDetails}>Save Estimates</Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-1 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4" /> Customer Target</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div>
                                <h4 className="font-semibold text-sm mb-1">{order.customerName}</h4>
                                <p className="text-xs text-gray-500">{order.customerEmail}</p>
                            </div>
                            {order.customerAddress && typeof order.customerAddress === 'object' && (
                                <div className="p-3 bg-gray-50 border rounded text-sm text-gray-700">
                                    <MapPin className="w-4 h-4 mb-2 text-gray-400" />
                                    {(order.customerAddress as any).line1}<br />
                                    {(order.customerAddress as any).city}, {(order.customerAddress as any).state} {(order.customerAddress as any).zip}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
