'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Store, Lock, Tag, Truck, Eye, EyeOff, Loader2, Briefcase } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

export default function RetailerSettingsPage() {
    const { data: session } = useSession()
    const [retailer, setRetailer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    const [securityData, setSecurityData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        newEmail: ''
    })
    const [showPasswords, setShowPasswords] = useState(false)
    const [savingSecurity, setSavingSecurity] = useState(false)

    useEffect(() => {
        if (session?.user?.email) {
            setSecurityData(prev => ({ ...prev, newEmail: session.user.email as string }))
        }
    }, [session?.user?.email])

    useEffect(() => {
        if (session?.user?.retailerId) {
            fetch(`/api/retailers/${session.user.retailerId}`)
                .then(res => res.json())
                .then(data => {
                    setRetailer(data)
                    setLoading(false)
                })
        }
    }, [session])

    const handleSave = async (data: any) => {
        try {
            const res = await fetch(`/api/retailers/${session?.user?.retailerId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!res.ok) throw new Error('Failed to update settings')

            const updated = await res.json()
            setRetailer(updated)
            toast({
                title: 'Settings Saved',
                description: 'Your changes have been updated successfully.'
            })
        } catch (e: any) {
            toast({
                title: 'Error',
                description: e.message || 'Failed to update',
                variant: 'destructive'
            })
        }
    }

    const handleSecuritySave = async () => {
        if (!securityData.currentPassword) {
            toast({ title: 'Error', description: 'Current password is required', variant: 'destructive' })
            return
        }
        if (securityData.newPassword && securityData.newPassword !== securityData.confirmPassword) {
            toast({ title: 'Error', description: 'New passwords do not match', variant: 'destructive' })
            return
        }

        setSavingSecurity(true)
        try {
            const res = await fetch('/api/retailers/security', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    currentPassword: securityData.currentPassword,
                    newPassword: securityData.newPassword,
                    newEmail: securityData.newEmail
                })
            })

            const contentType = res.headers.get('content-type')
            if (res.ok) {
                toast({ title: 'Success', description: 'Security settings updated successfully!' })
                setSecurityData(prev => ({ ...prev, currentPassword: '', newPassword: '', confirmPassword: '' }))
                if (securityData.newEmail) {
                    setRetailer((prev: any) => ({ ...prev, email: securityData.newEmail }))
                }
            } else {
                const errorText = contentType?.includes('application/json')
                    ? (await res.json()).message
                    : await res.text()
                toast({ title: 'Error', description: errorText || 'Failed to update security settings', variant: 'destructive' })
            }
        } catch (error) {
            console.error(error)
            toast({ title: 'Error', description: 'Something went wrong', variant: 'destructive' })
        } finally {
            setSavingSecurity(false)
        }
    }

    if (loading || !retailer) return <div className="p-12 text-center text-gray-500">Loading settings...</div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your retail store details, margins, and custom branding</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <div className="w-full overflow-x-auto pb-2 mb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="flex w-max min-w-full justify-start sm:inline-flex sm:w-auto sm:min-w-0 bg-white border h-auto sm:h-12 rounded-lg p-1 gap-1">
                        <TabsTrigger value="general" className="data-[state=active]:bg-gray-100 rounded-md text-sm whitespace-nowrap">General</TabsTrigger>
                        <TabsTrigger value="brand" className="data-[state=active]:bg-gray-100 rounded-md text-sm whitespace-nowrap">Label &amp; Brand</TabsTrigger>
                        <TabsTrigger value="shipping" className="data-[state=active]:bg-gray-100 rounded-md text-sm whitespace-nowrap">Shipping &amp; Margins</TabsTrigger>
                        <TabsTrigger value="security" className="data-[state=active]:bg-gray-100 rounded-md text-sm whitespace-nowrap">Security</TabsTrigger>
                    </TabsList>
                </div>

                {/* ── GENERAL ── */}
                <TabsContent value="general" className="mt-0 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Store className="w-5 h-5 text-blue-600" />
                                Business Profile
                            </CardTitle>
                            <CardDescription>Update your company's contact information</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Business Name</Label>
                                    <Input defaultValue={retailer.businessName} disabled />
                                    <p className="text-xs text-gray-500">Contact admin to change business name</p>
                                </div>
                                <div className="space-y-2">
                                    <Label>Primary Contact</Label>
                                    <Input
                                        defaultValue={retailer.contactName}
                                        onChange={(e) => setRetailer({ ...retailer, contactName: e.target.value })}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Business Email</Label>
                                    <Input type="email" defaultValue={retailer.email} disabled />
                                </div>
                                <div className="space-y-2">
                                    <Label>Phone Number</Label>
                                    <Input
                                        type="tel"
                                        defaultValue={retailer.phone}
                                        onChange={(e) => setRetailer({ ...retailer, phone: e.target.value })}
                                    />
                                </div>
                            </div>
                            <Button onClick={() => handleSave({ contactName: retailer.contactName, phone: retailer.phone })}>
                                Save Profile Changes
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── LABEL & BRAND ── */}
                <TabsContent value="brand" className="mt-0 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Tag className="w-5 h-5 text-blue-600" />
                                Your Label Setup
                            </CardTitle>
                            <CardDescription>
                                Your client orders a cushion. We make it. We stitch your brand label.
                                It's seamless, professional, and fully white-labelled.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            {/* Label Usage Preference */}
                            <div className="space-y-2">
                                <Label>Label Usage Preference</Label>
                                <Select
                                    value={retailer.labelPreference || 'NONE'}
                                    onValueChange={(val) => setRetailer({ ...retailer, labelPreference: val as any })}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select Label Preference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALWAYS">Always stitch my brand label (+$8/cushion)</SelectItem>
                                        <SelectItem value="PER_ORDER">Choose per order (can opt in or out per quote)</SelectItem>
                                        <SelectItem value="NONE">Plain / No label</SelectItem>
                                    </SelectContent>
                                </Select>
                                <p className="text-xs text-gray-500">
                                    {retailer.labelPreference === 'ALWAYS' && '⚠ Every quote will include the $8/cushion label fee automatically.'}
                                    {retailer.labelPreference === 'PER_ORDER' && 'You can enable or disable the label per individual quote.'}
                                    {(!retailer.labelPreference || retailer.labelPreference === 'NONE') && 'No label will be stitched. No extra charge.'}
                                </p>
                            </div>

                            {/* Label Title — Required when label is active */}
                            <div className="space-y-2">
                                <Label>
                                    Label Title <span className="text-red-500">*</span>
                                </Label>
                                <Input
                                    placeholder="e.g. My Brand Co."
                                    value={retailer.labelTitle || ''}
                                    onChange={(e) => setRetailer({ ...retailer, labelTitle: e.target.value })}
                                />
                                <p className="text-xs text-gray-500">
                                    This name will be included in the notepad file when downloading your label pack for a quote.
                                </p>
                            </div>

                            {/* Upload Label Image */}
                            <div className="space-y-2">
                                <Label>Upload Brand Label / Logo Image</Label>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-4 border rounded-lg bg-gray-50 border-dashed border-2">
                                    <div className="w-20 h-20 bg-white border shadow-sm rounded flex items-center justify-center overflow-hidden shrink-0">
                                        {retailer.labelFileUrl ? (
                                            <img src={retailer.labelFileUrl} alt="Label" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center px-1">No Image</span>
                                        )}
                                    </div>
                                    <div className="flex-1 w-full">
                                        <Input
                                            type="file"
                                            id="labelImageUpload"
                                            className="hidden"
                                            accept="image/png, image/jpeg, image/webp"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    const reader = new FileReader();
                                                    reader.onloadend = () => {
                                                        const img = new Image();
                                                        img.onload = () => {
                                                            const canvas = document.createElement('canvas');
                                                            canvas.width = img.width;
                                                            canvas.height = img.height;
                                                            const ctx = canvas.getContext('2d');
                                                            if (ctx) {
                                                                ctx.fillStyle = "#FFFFFF";
                                                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                                ctx.drawImage(img, 0, 0);
                                                                const safeBase64 = canvas.toDataURL('image/jpeg', 0.9);
                                                                setRetailer({ ...retailer, labelFileUrl: safeBase64 });
                                                            }
                                                        };
                                                        img.src = reader.result as string;
                                                    };
                                                    reader.readAsDataURL(file);
                                                }
                                            }}
                                        />
                                        <Button variant="outline" size="sm" className="mb-2" onClick={() => document.getElementById('labelImageUpload')?.click()}>
                                            {retailer.labelFileUrl ? 'Change Image' : 'Upload Image'}
                                        </Button>
                                        <p className="text-xs text-gray-500">JPG, PNG, WEBP — 300 DPI minimum</p>
                                        <p className="text-xs text-gray-400 mt-1">This image will be included in the label zip download for each quote.</p>
                                    </div>
                                </div>
                            </div>

                            {/* Validation notice */}
                            {(retailer.labelPreference === 'ALWAYS' || retailer.labelPreference === 'PER_ORDER') && !retailer.labelTitle && (
                                <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                                    ⚠ Please set a Label Title — it's required for the label pack download.
                                </div>
                            )}

                            <Button
                                onClick={() => {
                                    if ((retailer.labelPreference === 'ALWAYS' || retailer.labelPreference === 'PER_ORDER') && !retailer.labelTitle?.trim()) {
                                        toast({ title: 'Label Title Required', description: 'Please enter a Label Title before saving.', variant: 'destructive' })
                                        return
                                    }
                                    handleSave({
                                        labelPreference: retailer.labelPreference,
                                        labelTitle: retailer.labelTitle,
                                        labelFileUrl: retailer.labelFileUrl
                                    })
                                }}
                            >
                                Save Label Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── SHIPPING & MARGINS ── */}
                <TabsContent value="shipping" className="mt-0 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                Shipping &amp; Margins
                            </CardTitle>
                            <CardDescription>Set your pricing markup rules and shipping defaults</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 border rounded-lg p-5 bg-gray-50">
                                    <h3 className="text-md font-semibold flex items-center gap-2">
                                        <Briefcase className="w-4 h-4" /> Pricing Markup Margin
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Markup Type</Label>
                                            <Select
                                                value={retailer.markupType}
                                                onValueChange={(val) => setRetailer({ ...retailer, markupType: val as any })}
                                            >
                                                <SelectTrigger className="w-full">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Value {retailer.markupType === 'PERCENTAGE' ? '(%)' : '($)'}</Label>
                                            <div className="flex items-center gap-2">
                                                <button
                                                    type="button"
                                                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-50 active:bg-gray-100 select-none"
                                                    onClick={() => setRetailer((prev: any) => ({ ...prev, markupValue: Math.max(0, (parseFloat(prev.markupValue) || 0) - 1) }))}
                                                >−</button>
                                                <Input
                                                    type="number"
                                                    inputMode="decimal"
                                                    min={0}
                                                    value={retailer.markupValue}
                                                    onChange={(e) => setRetailer({ ...retailer, markupValue: parseFloat(e.target.value) || 0 })}
                                                    className="text-center"
                                                />
                                                <button
                                                    type="button"
                                                    className="h-10 w-10 shrink-0 flex items-center justify-center rounded-md border border-gray-300 bg-white text-gray-700 text-lg font-bold hover:bg-gray-50 active:bg-gray-100 select-none"
                                                    onClick={() => setRetailer((prev: any) => ({ ...prev, markupValue: (parseFloat(prev.markupValue) || 0) + 1 }))}
                                                >+</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-lg p-5 bg-gray-50">
                                    <h3 className="text-md font-semibold flex items-center gap-2">
                                        <Truck className="w-4 h-4" /> Shipping Preference
                                    </h3>
                                    <p className="text-sm text-gray-500">How do you prefer to receive completed orders by default?</p>
                                    <div className="space-y-2">
                                        <Select
                                            value={retailer.shippingPreference}
                                            onValueChange={(val) => setRetailer({ ...retailer, shippingPreference: val as any })}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="SHIP_TO_RETAILER">Ship to Me (Retailer)</SelectItem>
                                                <SelectItem value="DROP_SHIP">Drop-Ship to Client Directly</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => handleSave({
                                markupType: retailer.markupType,
                                markupValue: retailer.markupValue,
                                shippingPreference: retailer.shippingPreference
                            })}>
                                Save Shipping &amp; Margin Defaults
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ── SECURITY ── */}
                <TabsContent value="security" className="mt-0 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Account Security
                            </CardTitle>
                            <CardDescription>Manage your sign-in credentials</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 max-w-sm">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        value={securityData.newEmail}
                                        onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                                        placeholder="retailer@example.com"
                                    />
                                    <p className="text-xs text-gray-500">Update your login email</p>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>Current Password (required to save changes)</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords ? "text" : "password"}
                                            value={securityData.currentPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, currentPassword: e.target.value })}
                                            placeholder="Enter current password"
                                            className="pr-10 h-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>New Password (Optional)</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords ? "text" : "password"}
                                            value={securityData.newPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, newPassword: e.target.value })}
                                            placeholder="Leave blank to keep same"
                                            className="pr-10 h-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                                <div className="space-y-2 relative">
                                    <Label>Confirm New Password</Label>
                                    <div className="relative">
                                        <Input
                                            type={showPasswords ? "text" : "password"}
                                            value={securityData.confirmPassword}
                                            onChange={(e) => setSecurityData({ ...securityData, confirmPassword: e.target.value })}
                                            placeholder="Confirm new password"
                                            className="pr-10 h-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-0 top-0 h-full px-3 flex items-center justify-center text-gray-500 hover:text-gray-700"
                                        >
                                            {showPasswords ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <Button onClick={handleSecuritySave} disabled={savingSecurity}>
                                {savingSecurity ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Save Security Changes'}
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
