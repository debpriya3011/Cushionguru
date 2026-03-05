'use client'

import { useState, useEffect } from 'react'
import { BarChart3, TrendingUp, Users, DollarSign } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function AdminAnalyticsPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch('/api/admin/analytics')
            .then(res => res.json())
            .then(data => {
                setData(data)
                setLoading(false)
            })
            .catch(console.error)
    }, [])

    if (loading) return <div className="p-10 text-center text-gray-400">Loading Analytics Engines...</div>

    return (
        <div className="space-y-8 max-w-7xl mx-auto">
            <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Analytics Hub</h1>
                <p className="text-sm text-gray-500 mt-1">Key metrics and performance of your cushion business.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <AnalyticsCard
                    title="Total Revenue"
                    value={`$${(data?.stats?.totalRevenue || 0).toFixed(2)}`}
                    subtitle="Platform Aggregate Gross"
                    icon={<DollarSign className="w-5 h-5 text-gray-400" />}
                />
                <AnalyticsCard
                    title="Active Retailers"
                    value={data?.stats?.activeRetailers || 0}
                    subtitle="Generating quotes natively"
                    icon={<Users className="w-5 h-5 text-gray-400" />}
                />
                <AnalyticsCard
                    title="Quotes Generated"
                    value={data?.stats?.quotesGenerated || 0}
                    subtitle="By Retailers total"
                    icon={<BarChart3 className="w-5 h-5 text-gray-400" />}
                />
                <AnalyticsCard
                    title="Conversion Rate"
                    value={`${data?.stats?.conversionRate || 0}%`}
                    subtitle="Quotes converted to Orders"
                    icon={<TrendingUp className="w-5 h-5 text-gray-400" />}
                />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                <div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-500" />
                        Platform Revenue Timeline (Last 30 Days)
                    </h3>
                    <div className="h-60 sm:h-80 w-full text-sm">
                        {data?.trendData?.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-400 italic bg-gray-50 rounded-lg">
                                No order revenue generated in the last 30 days.
                            </div>
                        ) : (
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={data?.trendData || []}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="date" />
                                    <YAxis tickFormatter={(val) => `$${val}`} />
                                    <Tooltip formatter={(val) => `$${Number(val).toFixed(2)}`} />
                                    <Bar dataKey="revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-6 flex items-center gap-2">
                        <Users className="w-5 h-5 text-purple-500" />
                        Top Performer Accounts
                    </h3>
                    <div className="space-y-4">
                        {data?.topRetailers?.length === 0 ? (
                            <div className="h-64 flex flex-col items-center justify-center text-gray-400 text-sm italic bg-gray-50 rounded-lg">
                                <Users className="w-10 h-10 text-gray-300 mb-2" />
                                No active retailers yet
                            </div>
                        ) : (
                            data?.topRetailers?.map((r: any, idx: number) => (
                                <div key={r.id} className="flex justify-between items-center p-3 border rounded-lg bg-gray-50">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-purple-100 text-purple-800 font-bold p-2 h-8 w-8 flex items-center justify-center rounded-full text-xs">#{idx + 1}</div>
                                        <div>
                                            <p className="font-semibold text-gray-900 text-sm">{r.name}</p>
                                            <p className="text-xs text-gray-500">{r.quotes} quotes generated</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 text-sm">{r.orders} Orders</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

function AnalyticsCard({ title, value, subtitle, icon }: any) {
    return (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex flex-col relative overflow-hidden group">
            <div className="flex justify-between items-start mb-4 relative z-10">
                <p className="text-sm font-medium text-gray-500">{title}</p>
                <div className="p-2 bg-gray-50 rounded-lg">{icon}</div>
            </div>
            <div className="relative z-10">
                <h3 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{value}</h3>
                <p className="text-xs text-green-600 flex items-center gap-1 font-medium">{subtitle}</p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-0" />
        </div>
    )
}
