'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Store, PaintBucket, Lock, Briefcase, Tag, Truck } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

export default function RetailerSettingsPage() {
    const { data: session } = useSession()
    const [retailer, setRetailer] = useState<any>(null)
    const [loading, setLoading] = useState(true)

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

    if (loading || !retailer) return <div className="p-12 text-center text-gray-500">Loading settings...</div>

    return (
        <div className="space-y-8 max-w-5xl mx-auto">
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Store Settings</h1>
                <p className="text-sm text-gray-500 mt-1">Manage your retail store details, margins, and custom branding</p>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 bg-white border h-auto sm:h-12 rounded-lg p-1 justify-start gap-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-gray-100 rounded-md text-xs sm:text-sm">General</TabsTrigger>
                    <TabsTrigger value="brand" className="data-[state=active]:bg-gray-100 rounded-md text-xs sm:text-sm">Label & Brand</TabsTrigger>
                    {/* <TabsTrigger value="pdf" className="data-[state=active]:bg-gray-100 rounded-md">PDF Customization</TabsTrigger> */}
                    <TabsTrigger value="shipping" className="data-[state=active]:bg-gray-100 rounded-md text-xs sm:text-sm">Shipping & Margins</TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-gray-100 rounded-md text-xs sm:text-sm">Security</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="mt-6 space-y-6">
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

                <TabsContent value="brand" className="mt-6 space-y-6">
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
                            <div className="space-y-4">
                                <Label>Label Usage Preference</Label>
                                <Select
                                    value={retailer.labelPreference}
                                    onValueChange={(val) => setRetailer({ ...retailer, labelPreference: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Label Preference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALWAYS">Always stitch my brand label (+$8/cushion)</SelectItem>
                                        <SelectItem value="PER_ORDER">Choose per order</SelectItem>
                                        <SelectItem value="NONE">Plain / No label</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label>Label Style Preference</Label>
                                    <Input
                                        placeholder="e.g. Woven, Printed..."
                                        value={retailer.labelStyle || ''}
                                        onChange={(e) => setRetailer({ ...retailer, labelStyle: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Label Placement</Label>
                                    <Input
                                        placeholder="e.g. Bottom Right Seam, Back Centered..."
                                        value={retailer.labelPlacement || ''}
                                        onChange={(e) => setRetailer({ ...retailer, labelPlacement: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <Label>Upload Brand Logo / Label File</Label>
                                <div className="flex items-center gap-4 p-4 border rounded-lg bg-gray-50 border-dashed border-2">
                                    <div className="w-16 h-16 bg-white border shadow-sm rounded flex items-center justify-center overflow-hidden">
                                        {retailer.labelFileUrl ? (
                                            <img src={retailer.labelFileUrl} alt="Logo" className="w-full h-full object-contain" />
                                        ) : (
                                            <span className="text-gray-400 text-xs text-center">No Logo</span>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <Input
                                            type="file"
                                            id="logoUpload"
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
                                                                // Draw with white background in case it's a transparent png spoofed as jpg
                                                                ctx.fillStyle = "#FFFFFF";
                                                                ctx.fillRect(0, 0, canvas.width, canvas.height);
                                                                ctx.drawImage(img, 0, 0);
                                                                // Forcefully encode the final image footprint purely as JPG universally
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
                                        <Button variant="outline" size="sm" className="mb-1" onClick={() => document.getElementById('logoUpload')?.click()}>
                                            {retailer.labelFileUrl ? 'Change File' : 'Upload File'}
                                        </Button>
                                        <p className="text-xs text-gray-500">JPG, PNG, WEBP — 300 DPI minimum</p>
                                    </div>
                                </div>
                            </div>

                            <Button onClick={() => handleSave({
                                labelPreference: retailer.labelPreference,
                                labelStyle: retailer.labelStyle,
                                labelPlacement: retailer.labelPlacement,
                                labelFileUrl: retailer.labelFileUrl
                            })}>
                                Save Brand Settings
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="pdf" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Briefcase className="w-5 h-5 text-blue-600" />
                                PDF Customization
                            </CardTitle>
                            <CardDescription>Configure how your PDFs look for quotes and orders</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <Label>PDF Branding Preference</Label>
                                <Select
                                    value={retailer.pdfPreference}
                                    onValueChange={(val) => setRetailer({ ...retailer, pdfPreference: val as any })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select PDF Preference" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ALWAYS">Always show my brand label (+$10)</SelectItem>
                                        <SelectItem value="PER_ORDER">Choose per order</SelectItem>
                                        <SelectItem value="NONE">Plain / No label</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {retailer.pdfPreference === 'ALWAYS' && (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                                    <div className="space-y-4 border rounded-lg p-6 bg-gray-50 h-fit">
                                        <h3 className="text-sm font-semibold mb-2">Configure PDF Elements</h3>
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="flex flex-col space-y-3 pb-2 border-b">
                                                <div className="flex items-start space-x-3">
                                                    <Checkbox
                                                        id="auto-inject-logo"
                                                        checked={retailer.pdfCustomization?.includeLogo !== false}
                                                        onCheckedChange={(c: boolean) => setRetailer({ ...retailer, pdfCustomization: { ...retailer.pdfCustomization, includeLogo: !!c } })}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="auto-inject-logo" className="font-semibold cursor-pointer">Inject My Brand Logo</Label>
                                                        <p className="text-xs text-gray-500 font-normal">Automatically embed your uploaded Logo into the layout.</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-start space-x-3 mt-2">
                                                    <Checkbox
                                                        id="auto-inject-label"
                                                        checked={retailer.pdfCustomization?.includeLabel !== false}
                                                        onCheckedChange={(c: boolean) => setRetailer({ ...retailer, pdfCustomization: { ...retailer.pdfCustomization, includeLabel: !!c } })}
                                                    />
                                                    <div className="space-y-1">
                                                        <Label htmlFor="auto-inject-label" className="font-semibold cursor-pointer">Inject Brand Label</Label>
                                                        <p className="text-xs text-gray-500 font-normal">Add label indicators and text into the layout.</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Brand Label Text</Label>
                                                <Input
                                                    placeholder="[ BRAND LABEL APPLIED ]"
                                                    value={retailer.pdfCustomization?.labelText || ''}
                                                    onChange={(e) => setRetailer({ ...retailer, pdfCustomization: { ...retailer.pdfCustomization, labelText: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Header Text</Label>
                                                <Input
                                                    placeholder="Your Custom Tagline"
                                                    value={retailer.pdfCustomization?.headerText || ''}
                                                    onChange={(e) => setRetailer({ ...retailer, pdfCustomization: { ...retailer.pdfCustomization, headerText: e.target.value } })}
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Footer Contact Info</Label>
                                                <Input
                                                    placeholder="Phone, Address, Website..."
                                                    value={retailer.pdfCustomization?.footerContact || ''}
                                                    onChange={(e) => setRetailer({ ...retailer, pdfCustomization: { ...retailer.pdfCustomization, footerContact: e.target.value } })}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="border border-gray-200 rounded-lg p-4 bg-gray-100 flex flex-col items-center justify-center">
                                        <h3 className="text-sm font-semibold mb-4 w-full text-center text-gray-600">Sample PDF Preview</h3>
                                        <div className="w-full max-w-[220px] h-[300px] bg-white border shadow-sm flex flex-col justify-between p-4 text-[8px] leading-tight overflow-hidden mx-auto transition-all">
                                            <div className="font-bold text-[11px] text-blue-600 border-b pb-1 mb-2">
                                                {retailer.pdfCustomization?.headerText || retailer.businessName || 'Your Custom Header'}
                                            </div>
                                            <div className="space-y-1.5 mb-auto pl-1 pr-4">
                                                <div className="text-gray-400 font-bold mb-2">QUOTATION</div>
                                                <div className="h-1 bg-gray-200 w-3/4 rounded" />
                                                <div className="h-1 bg-gray-200 w-1/2 rounded" />
                                                <div className="flex justify-between items-center mt-3 pt-2 border-t border-gray-100">
                                                    <div className="h-2 bg-blue-500 w-full rounded" />
                                                </div>
                                                <div className="h-1 bg-gray-200 w-5/6 rounded mt-2" />
                                                <div className="h-1 bg-gray-200 w-2/3 rounded" />
                                                <div className="h-1 bg-gray-200 w-full rounded" />
                                                <div className="flex justify-end mt-4 pt-2 border-t border-gray-100">
                                                    <div className="text-blue-600 font-bold">TOTAL - $240.00</div>
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center mt-2 border-t pt-2 text-center text-gray-400">
                                                <span className="w-full text-[7px]">
                                                    Thank you for your business! | {retailer.pdfCustomization?.footerContact || 'Your Footer Appears Here...'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <Button onClick={() => handleSave({
                                pdfPreference: retailer.pdfPreference,
                                pdfCustomization: retailer.pdfCustomization
                            })}>
                                Save PDF Preferences
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="shipping" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Truck className="w-5 h-5 text-blue-600" />
                                Shipping & Margins
                            </CardTitle>
                            <CardDescription>Set your pricing markup rules and shipping defaults</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
                                    <h3 className="text-md font-semibold flex items-center gap-2"><Briefcase className="w-4 h-4" /> Pricing Markup Margin</h3>
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Markup Type</Label>
                                            <Select
                                                value={retailer.markupType}
                                                onValueChange={(val) => setRetailer({ ...retailer, markupType: val as any })}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="PERCENTAGE">Percentage (%)</SelectItem>
                                                    <SelectItem value="FIXED">Fixed Amount ($)</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Amount Value</Label>
                                            <Input
                                                type="number"
                                                value={retailer.markupValue}
                                                onChange={(e) => setRetailer({ ...retailer, markupValue: parseFloat(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 border rounded-lg p-6 bg-gray-50">
                                    <h3 className="text-md font-semibold flex items-center gap-2"><Truck className="w-4 h-4" /> Shipping Preference</h3>
                                    <p className="text-sm text-gray-500 mb-4">How do you prefer to receive completed orders by default?</p>
                                    <div className="space-y-2">
                                        <Select
                                            value={retailer.shippingPreference}
                                            onValueChange={(val) => setRetailer({ ...retailer, shippingPreference: val as any })}
                                        >
                                            <SelectTrigger>
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
                                Save Shipping & Margin Defaults
                            </Button>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="mt-6 space-y-6">
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
                                    <Label>Current Password</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>New Password</Label>
                                    <Input type="password" />
                                </div>
                                <div className="space-y-2">
                                    <Label>Confirm New Password</Label>
                                    <Input type="password" />
                                </div>
                            </div>
                            <Button variant="outline">Change Password</Button>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div >
    )
}
