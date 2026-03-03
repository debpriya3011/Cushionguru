'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { ArrowLeft, CheckCircle } from 'lucide-react'

export default function CalculatorAssignPage() {
    const params = useParams()
    const [calculator, setCalculator] = useState<any>(null)
    const [retailers, setRetailers] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [assigningId, setAssigningId] = useState<string | null>(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [calcRes, retRes] = await Promise.all([
                    fetch(`/api/calculators/${params.id}`),
                    fetch('/api/admin/retailers')
                ])

                if (calcRes.ok) {
                    setCalculator(await calcRes.json())
                }
                if (retRes.ok) {
                    setRetailers(await retRes.json())
                }
            } catch (error) {
                console.error('Failed to fetch data:', error)
            } finally {
                setLoading(false)
            }
        }
        fetchData()
    }, [params.id])

    const handleAssign = async (retailerId: string) => {
        setAssigningId(retailerId)
        try {
            const res = await fetch(`/api/retailers/${retailerId}/assign-calculator`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ calculatorId: params.id })
            })
            if (res.ok) {
                alert('Calculator successfully assigned to retailer!')
            } else {
                alert('Failed to assign calculator.')
            }
        } catch (error) {
            console.error(error)
            alert('An error occurred during assignment.')
        } finally {
            setAssigningId(null)
        }
    }

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <Link href="/admin/calculators">
                    <Button variant="outline" size="icon">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Assign Calculator</h1>
                    {calculator && <p className="text-gray-600 mt-1">{calculator.name}</p>}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Retailer Assignments</CardTitle>
                    <CardDescription>
                        Select retailers who will use this calculator template as their primary quoting tool.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {retailers.length === 0 ? (
                        <p className="text-gray-500 py-4 text-center">No active retailers found.</p>
                    ) : (
                        <div className="space-y-4">
                            {retailers.map((retailer) => (
                                <div key={retailer.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-lg hover:bg-gray-50">
                                    <div>
                                        <h3 className="font-semibold">{retailer.businessName}</h3>
                                        <p className="text-sm text-gray-500">{retailer.email}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        disabled={assigningId === retailer.id}
                                        onClick={() => handleAssign(retailer.id)}
                                    >
                                        {assigningId === retailer.id ? 'Assigning...' : 'Assign Calculator'}
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>

            <div className="flex justify-end pt-4">
                <Link href="/admin/calculators">
                    <Button>Done</Button>
                </Link>
            </div>
        </div>
    )
}
