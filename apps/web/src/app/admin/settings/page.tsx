'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Loader2, Upload, X, Lock, Eye, EyeOff } from 'lucide-react'
import { useSession } from 'next-auth/react'
import { toast } from '@/components/ui/use-toast'

export default function AdminSettingsPage() {
    const [settings, setSettings] = useState({
        showRetailerPriceBreakdown: false,
        autoApproveQuotes: false,
        companyName: 'Cushion SaaS Admin',
        supportEmail: 'support@yourcushiondomain.com',
        logoUrl: '',
    })
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [uploading, setUploading] = useState(false)

    const { data: session } = useSession()

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

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Validate file type
        if (!file.type.startsWith('image/')) {
            alert('Please upload an image file (PNG, JPG, SVG, etc.)')
            return
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            alert('Image must be smaller than 2MB')
            return
        }

        setUploading(true)
        const reader = new FileReader()
        reader.onloadend = () => {
            // Create an Image to resize if needed
            const img = new Image()
            img.onload = () => {
                const canvas = document.createElement('canvas')
                // Limit to 200x200 max for logo storage
                const maxSize = 200
                let width = img.width
                let height = img.height
                if (width > maxSize || height > maxSize) {
                    if (width > height) {
                        height = (height / width) * maxSize
                        width = maxSize
                    } else {
                        width = (width / height) * maxSize
                        height = maxSize
                    }
                }
                canvas.width = width
                canvas.height = height
                const ctx = canvas.getContext('2d')
                if (ctx) {
                    ctx.drawImage(img, 0, 0, width, height)
                    const base64 = canvas.toDataURL('image/png', 0.9)
                    setSettings(prev => ({ ...prev, logoUrl: base64 }))
                }
                setUploading(false)
            }
            img.onerror = () => {
                alert('Failed to process image')
                setUploading(false)
            }
            img.src = reader.result as string
        }
        reader.readAsDataURL(file)
    }

    const handleRemoveLogo = () => {
        setSettings(prev => ({ ...prev, logoUrl: '' }))
    }

    const handleSave = async () => {
        setSaving(true)
        try {
            const res = await fetch('/api/admin/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            })
            if (res.ok) {
                alert('Settings saved successfully!')
                window.location.reload()
            }
            else alert('Failed to save settings')
        } catch (error) {
            console.error(error)
        } finally {
            setSaving(false)
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
            const res = await fetch('/api/admin/security', {
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
                <div className="w-full overflow-x-auto pb-2 mb-6 hide-scrollbar -mx-4 px-4 sm:mx-0 sm:px-0">
                    <TabsList className="flex w-max min-w-full justify-start sm:inline-flex sm:w-auto sm:min-w-0">
                        <TabsTrigger value="general" className="whitespace-nowrap">General</TabsTrigger>
                        <TabsTrigger value="notifications" className="whitespace-nowrap">Emails & Notifications</TabsTrigger>
                        <TabsTrigger value="billing" className="whitespace-nowrap">Billing</TabsTrigger>
                        <TabsTrigger value="security" className="whitespace-nowrap">Security</TabsTrigger>
                    </TabsList>
                </div>
                <TabsContent value="general">
                    <Card>
                        <CardHeader>
                            <CardTitle>Business Information</CardTitle>
                            <CardDescription>Update your company details and platform branding.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label>Company Name</Label>
                                <Input
                                    value={settings.companyName}
                                    onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Support Email</Label>
                                <Input
                                    value={settings.supportEmail}
                                    onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Platform Logo</Label>
                                <p className="text-xs text-gray-500">
                                    This logo will appear in the header of both admin and retailer portals.
                                </p>
                                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-2">
                                    <div className="relative">
                                        <div className={`w-16 h-16 flex items-center justify-center overflow-hidden ${settings.logoUrl ? '' : 'bg-blue-50 rounded-lg border border-blue-100'}`}>
                                            {settings.logoUrl ? (
                                                <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-contain" />
                                            ) : (
                                                <span className="text-blue-500 font-bold text-xl">C</span>
                                            )}
                                        </div>
                                        {settings.logoUrl && (
                                            <button
                                                onClick={handleRemoveLogo}
                                                className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors z-10 shadow-sm"
                                                title="Remove logo"
                                            >
                                                <X className="w-3.5 h-3.5" />
                                            </button>
                                        )}
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id="logoUpload"
                                            accept="image/png,image/jpeg,image/svg+xml,image/webp"
                                            className="hidden"
                                            onChange={handleLogoUpload}
                                        />
                                        <Button
                                            variant="outline"
                                            onClick={() => document.getElementById('logoUpload')?.click()}
                                            disabled={uploading}
                                        >
                                            {uploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Processing...
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {settings.logoUrl ? 'Change Logo' : 'Upload Logo'}
                                                </>
                                            )}
                                        </Button>
                                        <p className="text-xs text-gray-500 mt-1">PNG, JPG, SVG, WEBP — Max 2MB</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-medium">Calculator Preferences</h3>
                                <div className="flex items-start sm:items-center space-x-3">
                                    <Checkbox
                                        id="showRetailerPriceBreakdown"
                                        checked={settings.showRetailerPriceBreakdown}
                                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, showRetailerPriceBreakdown: !!checked })}
                                        className="mt-1 sm:mt-0 !h-4 !w-4 min-w-[16px] min-h-[16px] shrink-0 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <Label htmlFor="showRetailerPriceBreakdown" className="cursor-pointer leading-tight pt-1 sm:pt-0">
                                        Show Full Price Breakdown to Retailers
                                    </Label>
                                </div>
                                <p className="text-sm text-gray-500 ml-7">
                                    If unchecked, retailers will only see the final generated quote/total price, not the exact cost of fiberfill, sewing, piping, etc.
                                </p>
                            </div>
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-medium">Quote Preferences</h3>
                                <div className="flex items-start sm:items-center space-x-3">
                                    <Checkbox
                                        id="autoApproveQuotes"
                                        checked={settings.autoApproveQuotes}
                                        onCheckedChange={(checked: boolean) => setSettings({ ...settings, autoApproveQuotes: !!checked })}
                                        className="mt-1 sm:mt-0 !h-4 !w-4 min-w-[16px] min-h-[16px] shrink-0 border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                    />
                                    <Label htmlFor="autoApproveQuotes" className="cursor-pointer leading-tight pt-1 sm:pt-0">
                                        Auto-approve sent quotes
                                    </Label>
                                </div>
                                <p className="text-sm text-gray-500 ml-7">
                                    If checked, quotes with status "SENT" will be automatically approved.
                                </p>
                            </div>

                            <Button onClick={handleSave} disabled={saving} className="w-full sm:w-auto">
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
                            <div className="bg-blue-50 border border-blue-100 p-4 rounded-lg flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                <div>
                                    <h4 className="font-semibold text-blue-900">Pro Plan</h4>
                                    <p className="text-sm text-blue-700">Unlimited retailers and quotes</p>
                                </div>
                                <div className="px-3 py-1 bg-blue-600 text-white rounded text-sm font-medium">Active</div>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="security">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Lock className="w-5 h-5 text-blue-600" />
                                Account Security
                            </CardTitle>
                            <CardDescription>Manage your admin sign-in credentials.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4 max-w-sm">
                                <div className="space-y-2">
                                    <Label>Email Address</Label>
                                    <Input
                                        type="email"
                                        value={securityData.newEmail}
                                        onChange={(e) => setSecurityData({ ...securityData, newEmail: e.target.value })}
                                        placeholder="admin@example.com"
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
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
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
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
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
                                            className="pr-10"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPasswords(!showPasswords)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 p-1"
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
