'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, User, Lock, Mail, AlertCircle, CheckCircle, Eye, EyeOff } from 'lucide-react'

import { Suspense } from 'react'

function AcceptInvitationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [step, setStep] = useState<'input_token' | 'verify' | 'form' | 'success'>('verify')
  const [tokenInput, setTokenInput] = useState('')
  const [activeToken, setActiveToken] = useState<string | null>(null)

  const [invitationData, setInvitationData] = useState<any>(null)
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Set active token from URL on mount
  useEffect(() => {
    if (token && !activeToken) {
      setActiveToken(token)
    } else if (!token && !activeToken) {
      setStep('input_token')
      setLoading(false)
    }
  }, [token, activeToken])

  // Verify token when activeToken changes
  useEffect(() => {
    if (!activeToken) {
      return
    }

    const verifyToken = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/auth/verify-invitation?token=${activeToken}`)
        const data = await res.json()

        if (!res.ok) {
          setError(data.error || 'Invalid invitation token')
          setStep('input_token')
        } else {
          setInvitationData(data)
          setStep('form')
          setError('')
        }
      } catch (err) {
        setError('Failed to verify invitation')
        setStep('input_token')
      } finally {
        setLoading(false)
      }
    }

    verifyToken()
  }, [activeToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    setLoading(true)

    try {
      const res = await fetch('/api/auth/accept-invitation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: activeToken,
          firstName: formData.firstName,
          lastName: formData.lastName,
          password: formData.password,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        setLoading(false)
        return
      }

      setStep('success')
    } catch (err) {
      setError('An error occurred. Please try again.')
      setLoading(false)
    }
  }

  const handleTokenSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim()) {
      setError('Please enter an invitation token or URL')
      return
    }
    setError('')

    // Extract token if it's a URL
    let extractedToken = tokenInput.trim()
    try {
      if (extractedToken.includes('http')) {
        const url = new URL(extractedToken)
        const urlToken = url.searchParams.get('token')
        if (urlToken) {
          extractedToken = urlToken
        }
      }
    } catch (e) {
      // Ignore URL parse error, use as is
    }

    setActiveToken(extractedToken)
  }

  if (step === 'verify' && loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (step === 'input_token') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-slate-900">Accept Invitation</h1>
            <p className="text-slate-600 mt-2">Enter your invitation details to continue</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Invitation Details</CardTitle>
              <CardDescription>
                Please paste the invitation URL or token you received in your email.
              </CardDescription>
            </CardHeader>

            <form onSubmit={handleTokenSubmit}>
              <CardContent className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="tokenInput">Invitation URL or Token</Label>
                  <Input
                    id="tokenInput"
                    placeholder="https://.../invite/accept?token=... or abc123def456"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    required
                  />
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    'Continue'
                  )}
                </Button>
              </CardFooter>
            </form>
            <p className="text-sm text-center text-gray-600 h-11">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:underline">
                Sign in
              </Link>
            </p>
          </Card>
        </div>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <CardTitle className="text-2xl mb-2">Account Created!</CardTitle>
            <CardDescription className="mb-6">
              Your account has been successfully created. You can now sign in.
            </CardDescription>
            <Button onClick={() => router.push('/login')} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Accept Invitation</h1>
          <p className="text-slate-600 mt-2">Create your account to get started</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Set Up Your Account</CardTitle>
            <CardDescription>
              {/* {invitationData?.retailerName && (
                <>You&apos;ve been invited to join <strong>{invitationData.retailerName}</strong></>
              )} */}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="firstName"
                      placeholder="John"
                      value={formData.firstName}
                      onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    placeholder="Doe"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={invitationData?.email || ''}
                    disabled
                    className="pl-10 bg-gray-100"
                  />
                </div>
                <p className="text-xs text-gray-500">Email cannot be changed</p>
              </div>
              <p className="text-md font-medium text-gray-900">Set Up Your Password</p>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="pl-10 pr-10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-0 sm:top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-0 sm:top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                    tabIndex={-1}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  'Create Account'
                )}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <AcceptInvitationForm />
    </Suspense>
  )
}
