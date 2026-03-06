'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, Mail, Phone, Calendar, Store, Edit, Trash2, Copy, Send, Activity, Settings2, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { toast } from '@/components/ui/use-toast'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'

const formatCurrency = (type: string, value: number) => {
    if (type === 'PERCENTAGE') return `${value}%`
    return `$${value.toFixed(2)}`
}

export default function RetailerDetailsPage() {
    const params = useParams()
    const [retailer, setRetailer] = useState<any>(null)
    const [analytics, setAnalytics] = useState<any[]>([])
    const [invitationData, setInvitationData] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [filterRange, setFilterRange] = useState('1Y') // 1Y, 6M, 30D

    const fetchRetailerContent = async () => {
        try {
            const [retailerRes, analyticsRes] = await Promise.all([
                fetch(`/api/retailers/${params.id}`),
                fetch(`/api/admin/retailers/${params.id}/analytics?range=${filterRange}`)
            ]);

            if (retailerRes.ok) {
                const data = await retailerRes.json();
                setRetailer(data);
            }
            if (analyticsRes.ok) {
                const adata = await analyticsRes.json();
                setAnalytics(adata.chartData || []);
                setInvitationData({ token: adata.invitationToken, status: adata.userStatus });
            }
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        if (params.id) fetchRetailerContent()
    }, [params.id, filterRange])

    const handleSuspend = async () => {
        const action = retailer.status === 'SUSPENDED' ? 'revoke suspension' : 'suspend';
        if (!confirm(`Are you sure you want to ${action} this retailer?`)) return;
        try {
            const res = await fetch(`/api/admin/retailers/${retailer.id}/suspend`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: retailer.status === 'SUSPENDED' ? 'unsuspend' : 'suspend'
                })
            });
            if (res.ok) {
                toast({ title: `Retailer ${action} successful` });
                fetchRetailerContent();
            } else {
                toast({ title: 'Error', description: 'Failed to update retailer status', variant: 'destructive' });
            }
        } catch (e: any) {
            toast({ title: 'Error Details', description: e.message, variant: 'destructive' })
        }
    }

    const copyInverseLink = () => {
        if (invitationData?.token) {
            const url = `${window.location.origin}/invite/accept?token=${invitationData.token}`;
            navigator.clipboard.writeText(url);
            toast({ title: 'Copied!', description: 'Invitation link copied to clipboard.' });
        }
    }

    const shareWhatsApp = () => {
        if (invitationData?.token) {
            const url = `${window.location.origin}/invite/accept?token=${invitationData.token}`;
            const text = `Hello! You've been invited to join Cushion Quoting as a Retailer to map & order quotes natively easily! Tap here to register: ${url}`;
            window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center py-20">
                <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full" />
            </div>
        )
    }

    if (!retailer) {
        return (
            <div className="text-center py-20 text-gray-500">
                <h2 className="text-xl font-bold mb-2">Retailer Not Found</h2>
                <Link href="/admin/retailers">
                    <Button variant="outline">Return to Retailers</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 border rounded-xl shadow-sm gap-4">
                <div className="flex items-start md:items-center space-x-4">
                    <Link href="/admin/retailers" className="mt-1 md:mt-0 shrink-0">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-xl md:text-3xl font-bold text-gray-900 flex flex-wrap items-center gap-2 md:gap-3">
                            {retailer.businessName}
                            <Badge variant="secondary" className={
                                retailer.status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                                    retailer.status === 'PENDING' ? 'bg-yellow-100 text-yellow-700' :
                                        retailer.status === 'SUSPENDED' ? 'bg-red-100 text-red-700' :
                                            'bg-gray-100 text-gray-700'
                            }>
                                {retailer.status}
                            </Badge>
                        </h1>
                        <p className="text-gray-500 mt-1 flex items-center gap-2">
                            <Store className="w-4 h-4 flex-shrink-0" /> Retailer Profile
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2 md:gap-3 w-full md:w-auto mt-2 md:mt-0">
                    {/* Invitation Link Logic */}
                    {invitationData?.status === 'PENDING' && (
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                            <Button variant="outline" onClick={copyInverseLink} className="border-blue-200 text-blue-700 hover:bg-blue-50 flex-1 sm:flex-none">
                                <Copy className="w-4 h-4 mr-2 flex-shrink-0" /> Copy Link
                            </Button>
                            <Button variant="outline" onClick={shareWhatsApp} className="border-emerald-200 text-emerald-700 hover:bg-emerald-50 flex-1 sm:flex-none">
                                <Send className="w-4 h-4 mr-2 flex-shrink-0" /> WhatsApp
                            </Button>
                        </div>
                    )}

                    {retailer.status === 'SUSPENDED' ? (
                        <Button variant="outline" className="text-green-600 hover:bg-green-50 border border-green-200 w-full sm:w-auto" onClick={handleSuspend}>
                            <CheckCircle className="w-4 h-4 mr-2 flex-shrink-0" /> Revoke Suspension
                        </Button>
                    ) : (
                        <Button variant="destructive" className="bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 w-full sm:w-auto" onClick={handleSuspend}>
                            <Trash2 className="w-4 h-4 mr-2 flex-shrink-0" /> Suspend
                        </Button>
                    )}
                </div>
            </div>

            <Tabs defaultValue="overview">
                <div className="w-full overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="bg-white border rounded-lg p-1 flex w-max min-w-full justify-start sm:inline-flex sm:w-auto sm:min-w-0">
                        <TabsTrigger value="overview" className="whitespace-nowrap">Overview & Contact</TabsTrigger>
                        <TabsTrigger value="analytics" className="whitespace-nowrap">Analytics & Graphs</TabsTrigger>
                        <TabsTrigger value="permissions" className="whitespace-nowrap">Permissions & Margins</TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="overview" className="mt-4 sm:mt-6">
                    <div className="col-span-1 border rounded-xl bg-white p-6 shadow-sm max-w-3xl">
                        <h3 className="font-semibold text-gray-900 border-b pb-4 mb-4">Contact Information</h3>
                        <div className="space-y-4">
                            <div>
                                <p className="text-sm text-gray-500 mb-1">Primary Contact</p>
                                <p className="font-medium text-gray-900">{retailer.contactName}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Mail className="w-3 h-3" /> Email</p>
                                <a href={`mailto:${retailer.email}`} className="font-medium text-blue-600 hover:underline">{retailer.email}</a>
                            </div>
                            {retailer.phone && (
                                <div>
                                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</p>
                                    <p className="font-medium text-gray-900">{retailer.phone}</p>
                                </div>
                            )}
                            <div>
                                <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Joined</p>
                                <p className="font-medium text-gray-900">
                                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'long' }).format(new Date(retailer.createdAt))}
                                </p>
                            </div>
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="analytics" className="mt-6">
                    <div className="border rounded-xl bg-white p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-4 mb-6 sm:mb-8 gap-4">
                            <div>
                                <h3 className="font-semibold text-gray-900 flex items-center gap-2">
                                    <Activity className="w-5 h-5 text-blue-600" /> Account Activity
                                </h3>
                                <p className="text-sm text-gray-500">Track orders and quotes submitted by this retailer.</p>
                            </div>
                            <div className="flex border rounded-lg overflow-hidden bg-gray-50 w-full sm:w-auto">
                                <Button variant="ghost" className={`flex-1 sm:flex-none rounded-none px-3 py-2 text-sm ${filterRange === '30D' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`} onClick={() => setFilterRange('30D')}>30 Days</Button>
                                <Button variant="ghost" className={`flex-1 sm:flex-none rounded-none px-3 py-2 border-l text-sm ${filterRange === '6M' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`} onClick={() => setFilterRange('6M')}>6 Months</Button>
                                <Button variant="ghost" className={`flex-1 sm:flex-none rounded-none px-3 py-2 border-l text-sm ${filterRange === '1Y' ? 'bg-blue-100 text-blue-800' : 'text-gray-600'}`} onClick={() => setFilterRange('1Y')}>1 Year</Button>
                            </div>
                        </div>

                        <div className="h-[400px] w-full">
                            {analytics.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-gray-400">Not enough data to graph timeline.</div>
                            ) : (
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={analytics}>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                        <XAxis dataKey="date" />
                                        <YAxis yAxisId="left" />
                                        <YAxis yAxisId="right" orientation="right" />
                                        <Tooltip />
                                        <Bar yAxisId="left" dataKey="orders" fill="#3b82f6" name="Orders" radius={[4, 4, 0, 0]} />
                                        <Bar yAxisId="left" dataKey="quotes" fill="#93c5fd" name="Quotes" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            )}
                        </div>
                    </div>
                </TabsContent>

                <TabsContent value="permissions" className="mt-6 space-y-6">
                    <div className="border rounded-xl bg-white p-6 shadow-sm">
                        <h3 className="font-semibold text-gray-900 border-b pb-4 mb-4 flex items-center gap-2">
                            <Settings2 className="w-5 h-5 text-blue-600" /> Pricing Configuration
                        </h3>
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                            <div>
                                <p className="font-medium text-gray-900">Custom Markup Configuration</p>
                                <p className="text-sm text-gray-500">Global markup applied to all templates assigned to this retailer.</p>
                            </div>
                            <div className="bg-blue-50 border border-blue-100 px-4 py-3 sm:py-2 rounded-lg w-full sm:w-auto min-w-[200px] flex sm:block items-center justify-between">
                                <span className="text-sm text-blue-800 font-medium">Markup Strategy: </span>
                                <span className="font-bold text-blue-900">{retailer.markupType} ({formatCurrency(retailer.markupType, Number(retailer.markupValue) || 0)})</span>
                            </div>
                        </div>
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    )
}
