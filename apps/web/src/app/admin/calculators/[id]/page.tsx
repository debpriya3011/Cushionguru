'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Calculator } from '@/components/calculator'
import { ArrowLeft, Edit } from 'lucide-react'

export default function CalculatorPreviewPage() {
    const params = useParams()
    const [calculator, setCalculator] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [show3D, setShow3D] = useState(true)
    const [showPrices, setShowPrices] = useState(true)

    useEffect(() => {
        const fetchCalculator = async () => {
            try {
                const res = await fetch(`/api/calculators/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setCalculator(data)
                }
            } catch (error) {
                console.error('Failed to fetch calculator:', error)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) {
            fetchCalculator()
        }
    }, [params.id])

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
    )

    if (!calculator) return (
        <div className="text-center py-20 text-gray-500">
            Calculator not found
        </div>
    )

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/calculators">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">{calculator.name}</h1>
                        <p className="text-gray-600 mt-1">{calculator.description}</p>
                    </div>
                </div>
                <Link href={`/admin/calculators/${params.id}/edit`}>
                    <Button>
                        <Edit className="mr-2 h-4 w-4" />
                        Edit Template
                    </Button>
                </Link>
            </div>

            <div className="bg-gray-50 p-8 rounded-xl border border-gray-200">
                <div className="mb-8 border-b border-gray-200 pb-4 flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Live Preview</h2>
                        <p className="text-gray-600">
                            This is how the calculator template functions. Adjust selections to test calculations.
                        </p>
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center space-x-2 bg-white px-4 py-2 rounded border cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={show3D}
                                onChange={(e) => setShow3D(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">Show 3D View</span>
                        </label>
                        <label className="flex items-center space-x-2 bg-white px-4 py-2 rounded border cursor-pointer hover:bg-gray-50 whitespace-nowrap">
                            <input
                                type="checkbox"
                                checked={showPrices}
                                onChange={(e) => setShowPrices(e.target.checked)}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm font-medium">Show Price Box</span>
                        </label>
                    </div>
                </div>

                {/* Render the calculator in preview mode */}
                <div className="max-w-[1400px] mx-auto relative">
                    <Calculator
                        retailerId="preview"
                        config={Object.keys(calculator.config || {}).length > 0 ? calculator.config : undefined}
                        features={{ show3D, showPrices }}
                        onCalculate={(calc, sel) => console.log('Preview Calculation:', calc)}
                    />
                </div>
            </div>
        </div>
    )
}
