'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'

export default function NewQuotePage() {
    const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [retailers, setRetailers] = useState<any[]>([])

    const [formData, setFormData] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        retailerId: '',
    })

    useEffect(() => {
        const fetchRetailers = async () => {
            try {
                const res = await fetch('/api/admin/retailers')
                if (res.ok) {
                    const data = await res.json()
                    setRetailers(data)
                    if (data.length > 0) {
                        setFormData(prev => ({ ...prev, retailerId: data[0].id }))
                    }
                }
            } catch (error) {
                console.error('Failed to fetch retailers:', error)
            }
        }
        fetchRetailers()
    }, [])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        try {
            const res = await fetch('/api/quotes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customerDetails: {
                        firstName: formData.firstName,
                        lastName: formData.lastName,
                        email: formData.email,
                        phone: formData.phone,
                    },
                    items: [], // By default, create quote with no items for placeholder
                    retailerId: formData.retailerId || undefined
                }),
            })

            if (res.ok) {
                router.push('/admin/dashboard')
            } else {
                console.error('Failed to create quote')
            }
        } catch (error) {
            console.error('Error creating quote:', error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto py-8">
            <Card>
                <CardHeader>
                    <CardTitle>Create New Quote</CardTitle>
                    <CardDescription>
                        Enter customer details and configure items for a new quote.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-8">
                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Customer Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="firstName">First Name</Label>
                                    <Input
                                        id="firstName"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="lastName">Last Name</Label>
                                    <Input
                                        id="lastName"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <h3 className="text-lg font-medium">Retailer Assignment</h3>
                            <div className="space-y-2 max-w-sm">
                                <Label htmlFor="retailerId">Select Retailer</Label>
                                <select
                                    id="retailerId"
                                    className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={formData.retailerId}
                                    onChange={(e) => setFormData({ ...formData, retailerId: e.target.value })}
                                >
                                    <option value="">Select a retailer...</option>
                                    {retailers.map((r) => (
                                        <option key={r.id} value={r.id}>
                                            {r.businessName}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end space-x-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={loading}
                            >
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? 'Creating...' : 'Create Quote'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
