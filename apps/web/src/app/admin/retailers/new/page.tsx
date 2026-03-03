'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { ArrowLeft, Loader2, AlertCircle, CheckCircle } from 'lucide-react'

export default function NewRetailerPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [invitationUrl, setInvitationUrl] = useState('')

  const [formData, setFormData] = useState({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    markupType: 'PERCENTAGE',
    markupValue: '20',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    zip: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/admin/retailers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: formData.businessName,
          contactName: formData.contactName,
          email: formData.email,
          phone: formData.phone,
          markupType: formData.markupType,
          markupValue: parseFloat(formData.markupValue),
          address: {
            line1: formData.addressLine1,
            line2: formData.addressLine2,
            city: formData.city,
            state: formData.state,
            zip: formData.zip,
          },
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create retailer')
        setLoading(false)
        return
      }

      setInvitationUrl(data.invitationUrl)
      setSuccess(true)
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Retailer Created!</CardTitle>
            <p className="text-gray-600 mb-6">
              {formData.businessName} has been added successfully.
            </p>
            
            <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
              <p className="text-sm font-medium text-gray-700 mb-2">
                Invitation Link:
              </p>
              <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                {invitationUrl}
              </code>
              <p className="text-xs text-gray-500 mt-2">
                Share this link with the retailer to let them set up their account.
              </p>
            </div>

            <div className="flex gap-4 justify-center">
              <Button onClick={() => router.push('/admin/retailers')}>
                Back to Retailers
              </Button>
              <Button variant="outline" onClick={() => {
                setSuccess(false)
                setFormData({
                  businessName: '',
                  contactName: '',
                  email: '',
                  phone: '',
                  markupType: 'PERCENTAGE',
                  markupValue: '20',
                  addressLine1: '',
                  addressLine2: '',
                  city: '',
                  state: '',
                  zip: '',
                })
              }}>
                Add Another
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <Link href="/admin/retailers">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Retailers
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Add New Retailer</CardTitle>
        </CardHeader>
        
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-6">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Business Info */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Business Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business Name *</Label>
                  <Input
                    id="businessName"
                    value={formData.businessName}
                    onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contactName">Contact Name *</Label>
                  <Input
                    id="contactName"
                    value={formData.contactName}
                    onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Markup Settings */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Pricing Settings</h3>
              
              <RadioGroup
                value={formData.markupType}
                onValueChange={(value) => setFormData({ ...formData, markupType: value })}
                className="flex gap-4"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="PERCENTAGE" id="percentage" />
                  <Label htmlFor="percentage">Percentage</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="FIXED" id="fixed" />
                  <Label htmlFor="fixed">Fixed Amount</Label>
                </div>
              </RadioGroup>

              <div className="space-y-2">
                <Label htmlFor="markupValue">
                  Markup {formData.markupType === 'PERCENTAGE' ? '(%)' : '($)'}
                </Label>
                <Input
                  id="markupValue"
                  type="number"
                  step={formData.markupType === 'PERCENTAGE' ? '1' : '0.01'}
                  value={formData.markupValue}
                  onChange={(e) => setFormData({ ...formData, markupValue: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Address */}
            <div className="space-y-4">
              <h3 className="font-medium text-gray-900">Address</h3>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine1">Address Line 1</Label>
                <Input
                  id="addressLine1"
                  value={formData.addressLine1}
                  onChange={(e) => setFormData({ ...formData, addressLine1: e.target.value })}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="addressLine2">Address Line 2</Label>
                <Input
                  id="addressLine2"
                  value={formData.addressLine2}
                  onChange={(e) => setFormData({ ...formData, addressLine2: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city">City</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="zip">ZIP</Label>
                  <Input
                    id="zip"
                    value={formData.zip}
                    onChange={(e) => setFormData({ ...formData, zip: e.target.value })}
                  />
                </div>
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button 
                type="submit" 
                className="flex-1"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  'Create Retailer'
                )}
              </Button>
              <Link href="/admin/retailers">
                <Button variant="outline" type="button">
                  Cancel
                </Button>
              </Link>
            </div>
          </CardContent>
        </form>
      </Card>
    </div>
  )
}
