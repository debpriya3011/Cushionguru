'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, MapPin, Truck, CheckCircle2, Box, Package, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

const STATUS_STEPS = [
    { value: 'PENDING', label: 'Order Received', icon: Box },
    { value: 'CONFIRMED', label: 'Order Confirmed', icon: CheckCircle2 },
    { value: 'IN_PRODUCTION', label: 'In Production', icon: Package },
    { value: 'SHIPPED', label: 'Shipped', icon: Truck },
    { value: 'DELIVERED', label: 'Delivered', icon: MapPin },
]

export default function RetailerOrderTrackerPage() {
    const params = useParams()
    const [order, setOrder] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const res = await fetch(`/api/orders/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setOrder(data)
                }
            } catch (error) {
                console.error(error)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) fetchOrder()
    }, [params.id])

    if (loading || !order) return <div className="p-10 text-center text-gray-400">Loading Order Tracking...</div>

    const currentStepIndex = STATUS_STEPS.findIndex(s => s.value === order.status)
    const activeStep = currentStepIndex >= 0 ? currentStepIndex : 0;

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex justify-between items-center bg-white p-6 border rounded-xl shadow-sm">
                <div className="flex items-center space-x-4">
                    <Link href="/retailer/orders">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                            Order {order.orderNumber}
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            Customer: {order.customerName}
                        </p>
                    </div>
                </div>
                <div className="flex gap-3 items-center">
                    <Button variant="outline" onClick={() => window.open(`/api/orders/${order.id}/pdf`, '_blank')}>
                        <Download className="w-4 h-4 mr-2" /> Download PDF
                    </Button>
                    <div className="flex flex-col items-end">
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800 text-sm py-1 px-3">
                            {order.status.replace('_', ' ')}
                        </Badge>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2"><Truck className="w-5 h-5 text-blue-600" /> Tracking Timeline</CardTitle>
                    <CardDescription>Live updates on your ongoing production run.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6">
                    <div className="relative border-l-2 border-gray-100 ml-3 pl-8 py-2 space-y-12">
                        {STATUS_STEPS.map((step, idx) => {
                            const isCompleted = idx <= activeStep;
                            const isCurrent = idx === activeStep;
                            const Icon = step.icon;

                            return (
                                <div key={step.value} className="relative">
                                    <div className={`absolute -left-[41px] top-1 p-1 rounded-full border-2 bg-white ${isCompleted ? 'border-blue-500 text-blue-500' : 'border-gray-200 text-gray-300'}`}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <h4 className={`font-semibold ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>{step.label}</h4>
                                            {isCurrent && <p className="text-sm font-medium text-blue-600 mt-1">Currently in this phase</p>}
                                        </div>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Shipping Metrics</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <p className="text-sm text-gray-500">Carrier Tracking Number</p>
                            <p className="font-semibold">{order.shippingTrackingNumber || 'Pending Assignment'}</p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-500">Estimated Delivery Date</p>
                            <p className="font-semibold">{order.estimatedDeliveryDate ? new Date(order.estimatedDeliveryDate).toLocaleDateString() : 'Pending Computation'}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base">Destination Target</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {order.customerAddress ? (
                            <div className="text-sm text-gray-700">
                                <p className="font-semibold mb-1">{order.customerName}</p>
                                {(order.customerAddress as any).line1}<br />
                                {(order.customerAddress as any).city}, {(order.customerAddress as any).state} {(order.customerAddress as any).zip}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-500 italic">No address provided.</div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
