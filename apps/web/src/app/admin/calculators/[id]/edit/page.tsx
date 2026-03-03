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
        configStr: '{}',
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
                        configStr: JSON.stringify(data.config || {}, null, 2),
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

        let parsedConfig = {}
        try {
            if (formData.configStr.trim() !== '') {
                parsedConfig = JSON.parse(formData.configStr)
            }
        } catch (err) {
            setError('Invalid JSON in configuration. Please fix it before saving.')
            setSaving(false)
            return
        }

        try {
            const res = await fetch(`/api/calculators/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    description: formData.description,
                    status: formData.status,
                    config: parsedConfig,
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
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/calculators">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Edit Template</h1>
                        <p className="text-gray-600 mt-1">Modify calculator options and configuration.</p>
                    </div>
                </div>
                <Link href={`/admin/calculators/${params.id}`}>
                    <Button variant="outline">
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Basic Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                        </CardContent>
                    </Card>

                    <Card className="md:col-span-1">
                        <CardHeader>
                            <CardTitle>Configuration (Advanced)</CardTitle>
                            <CardDescription>
                                JSON format override. Leave as {"{}"} to use default shapes, foams, fabrics, and options.
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Textarea
                                value={formData.configStr}
                                onChange={(e) => setFormData({ ...formData, configStr: e.target.value })}
                                className="font-mono text-sm h-[320px] bg-gray-50 text-gray-800 focus:bg-white"
                                spellCheck={false}
                            />
                        </CardContent>
                    </Card>
                </div>

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
