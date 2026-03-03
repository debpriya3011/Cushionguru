'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Loader2 } from 'lucide-react'

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        showRetailerPriceBreakdown: false,
        autoApproveQuotes: false,
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        fetch('/api/admin/settings')
            .then(res => res.json())
            .then(data => {
                setSettings(prev => ({ ...prev, ...data }))
                setLoading(false)
            })
            .catch(err => {
                console.error(err)
                setLoading(false)
            })
    }, [])

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) alert('Settings saved successfully!')
            else alert('Failed to save settings')
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return <div className="p-12 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" /></div>
    }

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Platform Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage global settings for your Cushion SaaS</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="mb-8">
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="notifications">Emails & Notifications</TabsTrigger>
                    <TabsTrigger value="billing">Billing</TabsTrigger>
                </TabsList>
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                            <CardDescription>Update your company details and platform branding.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input defaultValue="Cushion SaaS Admin" />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input defaultValue="support@yourcushiondomain.com" />
                            </div>
                            <div className="space-y-2">
                                <Label>Platform Logo</Label>
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 bg-blue-50 rounded-lg flex items-center justify-center border border-blue-100">
                                        <span className="text-blue-500 font-bold text-xl">C</span>
                                    </div>
                                    <Button variant="outline">Upload New Logo</Button>
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-medium">Calculator Preferences</h3>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="showRetailerPriceBreakdown"
                                            checked={settings.showRetailerPriceBreakdown}
                                            onChange={(e) => setSettings({ ...settings, showRetailerPriceBreakdown: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="showRetailerPriceBreakdown">
                                            Show Full Price Breakdown to Retailers
                                        </Label>
                                    </div>
                                    <p className="text-sm text-gray-500 ml-6">
                                        If unchecked, retailers will only see the final generated quote/total price, not the exact cost of fiberfill, sewing, piping, etc.
                                    </p>
                                </div>
                                <div className="space-y-4 pt-4 border-t">
                                    <h3 className="text-lg font-medium">Quote Preferences</h3>
                                    <div className="flex items-center space-x-2">
                                        <input
                                            type="checkbox"
                                            id="autoApproveQuotes"
                                            checked={settings.autoApproveQuotes}
                                            onChange={(e) => setSettings({ ...settings, autoApproveQuotes: e.target.checked })}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <Label htmlFor="autoApproveQuotes">
                                            Auto-approve sent quotes
                                        </Label>
                                    </div>
                                    <p className="text-sm text-gray-500 ml-6">
                                        If checked, quotes with status "SENT" will be automatically approved.
                                    </p>
                                </div>
                            </div>

                            <Button onClick={handleSave} disabled={saving}>
                                {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="notifications">
                    <Card>
                        <CardHeader>
                            <CardTitle>Email Settings</CardTitle>
                            <CardDescription>Configure the emails sent to retailers and customers.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-gray-500 italic py-8">Email configuration requires SMTP integration setup.</p>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="billing">
                    <Card>
                        <CardHeader>
                            <CardTitle>Subscription & Billing</CardTitle>
                            <CardDescription>Manage your active plan and payment methods.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex justify-between items-center">
                                <div>
                                    <h4 className="font-semibold text-blue-900">Pro Plan</h4>
                                    <p className="text-sm text-blue-700">Unlimited retailers and quotes</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">Active</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
