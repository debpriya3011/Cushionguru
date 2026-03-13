'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Eye } from 'lucide-react'

export default function CalculatorEditPage() {
    const router = useRouter()
    const params = useParams()
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [error, setError] = useState('')

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        status: 'DRAFT',
    })

    useEffect(() => {
        const fetchCalculator = async () => {
            try {
                const res = await fetch(`/api/calculators/${params.id}`)
                if (res.ok) {
                    const data = await res.json()
                    setFormData({
                        name: data.name || '',
                        description: data.description || '',
                        status: data.status || 'DRAFT',
                    })
                }
            } catch (err) {
                console.error('Failed to fetch calculator:', err)
            } finally {
                setLoading(false)
            }
        }
        if (params.id) {
            fetchCalculator()
        }
    }, [params.id])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSaving(true)
        setError('')

        try {
            const res = await fetch(`/api/calculators/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    status: formData.status,
                }),
            })

            if (res.ok) {
                router.push(`/admin/calculators/${params.id}`)
            } else {
                const errorData = await res.json()
                setError(errorData.error || 'Failed to update calculator template.')
            }
        } catch (err) {
            console.error('Error updating calculator:', err)
            setError('An unexpected error occurred.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex justify-center items-center py-20">
            <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
        </div>
    )

    return (
        <div className="max-w-4xl mx-auto space-y-6 sm:space-y-8">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
                <div className="flex items-start gap-3 sm:gap-4 min-w-0">
                    <Link href="/admin/calculators">
                        <Button variant="outline" size="icon" className="shrink-0">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div className="min-w-0">
                        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
                            Edit Template
                        </h1>
                        <p className="text-sm sm:text-base text-gray-600 mt-1">
                            Modify calculator options and configuration.
                        </p>
                    </div>
                </div>
                <Link href={`/admin/calculators/${params.id}`}>
                    <Button variant="outline" className="w-full sm:w-auto justify-center">
                        <Eye className="mr-2 h-4 w-4" />
                        Preview Mode
                    </Button>
                </Link>
            </div>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-500 p-4">
                    <p className="text-red-700">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Template Details</CardTitle>
                        <CardDescription>
                            Update the name, description, and availability for this calculator template.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Template Name</Label>
                                <Input
                                    id="name"
                                    required
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Standard Outdoor Cushions"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    rows={4}
                                    placeholder="Notes about this template..."
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="status">Availability</Label>
                                <select
                                    id="status"
                                    value={formData.status}
                                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                                    className="w-full text-sm border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 py-2 px-3 border"
                                >
                                    <option value="DRAFT">Draft</option>
                                    <option value="ACTIVE">Active</option>
                                    <option value="ARCHIVED">Archived</option>
                                </select>
                            </div>
                        </div>

                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4 sm:p-5 space-y-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">Preview Mode</p>
                                <p className="text-sm text-gray-600 mt-1">
                                    Use <span className="font-medium">Preview Mode</span> to review how this template behaves before assigning it to retailers.
                                </p>
                            </div>
                            <div className="border-t border-gray-200 pt-3">
                                <p className="text-sm font-semibold text-gray-900">Availability</p>
                                <ul className="mt-2 space-y-1 text-sm text-gray-600">
                                    <li><span className="font-medium text-gray-800">Draft</span> — hidden from retailers</li>
                                    <li><span className="font-medium text-gray-800">Active</span> — available for assignment</li>
                                    <li><span className="font-medium text-gray-800">Archived</span> — keep for history, don’t use for new work</li>
                                </ul>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="flex justify-end space-x-4 pt-4 border-t border-gray-100">
                    <Link href="/admin/calculators">
                        <Button variant="outline" type="button" disabled={saving}>
                            Cancel
                        </Button>
                    </Link>
                    <Button type="submit" disabled={saving}>
                        {saving ? 'Saving Changes...' : 'Save Template'}
                    </Button>
                </div>
            </form>
        </div>
    )
}
