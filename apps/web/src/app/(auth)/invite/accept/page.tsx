'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
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
      <div className="min-h-screen flex items-center justify-center bg-[#e2e8f0] p-4">
        <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
      </div>
    )
  }

  if (step === 'input_token') {
    return (
      <div className="min-h-screen flex flex-col bg-[#e2e8f0] p-4">
        <div className="text-center mb-6 mt-6">
          <h1 className="text-3xl font-bold text-slate-800">Cushion Quoting</h1>
          <p className="text-slate-600 mt-2">Accept your invitation</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl overflow-hidden bg-slate-700 shadow-xl border border-slate-600 p-8">
            <h2 className="text-2xl font-bold text-white">Invitation Details</h2>
            <p className="text-slate-400 mt-1 mb-6">
              Please paste the invitation URL or token you received in your email.
            </p>

            <form onSubmit={handleTokenSubmit} className="space-y-4">
              {error && (
                <Alert variant="destructive" className="bg-red-950/50 border-red-500 text-red-200">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="tokenInput" className="text-slate-200">Invitation URL or Token</Label>
                <Input
                  id="tokenInput"
                  placeholder="https://.../invite/accept?token=... or paste token"
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full h-11 bg-slate-600 hover:bg-slate-500 text-white font-medium"
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
            </form>

            <p className="text-sm text-center text-slate-400 mt-6">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-400 hover:underline">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 pb-4">
          © {new Date().getFullYear()} Cushion Quoting System. All rights reserved.
        </p>
      </div>
    )
  }

  if (step === 'success') {
    return (
      <div className="min-h-screen flex flex-col bg-[#e2e8f0] p-4">
        <div className="text-center mb-6 mt-6">
          <h1 className="text-3xl font-bold text-slate-800">Cushion Quoting</h1>
          <p className="text-slate-600 mt-2">Accept your invitation</p>
        </div>

        <div className="flex-1 flex items-center justify-center">
          <div className="w-full max-w-md rounded-xl overflow-hidden bg-slate-700 shadow-xl border border-slate-600 p-8 text-center">
            <CheckCircle className="h-16 w-16 text-emerald-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Account Created!</h2>
            <p className="text-slate-400 mb-6">
              Your account has been successfully created. You can now sign in.
            </p>
            <Button
              onClick={() => router.push('/login')}
              className="w-full h-11 bg-slate-600 hover:bg-slate-500 text-white font-medium"
            >
              Go to Login
            </Button>
          </div>
        </div>

        <p className="text-center text-sm text-slate-500 mt-8 pb-4">
          © {new Date().getFullYear()} Cushion Quoting System. All rights reserved.
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e2e8f0] p-4">
      <div className="text-center mb-6 mt-6">
        <h1 className="text-3xl font-bold text-slate-800">Cushion Quoting</h1>
        <p className="text-slate-600 mt-2">Create your account to get started</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md rounded-xl overflow-hidden bg-slate-700 shadow-xl border border-slate-600 p-8">
          <h2 className="text-2xl font-bold text-white">Set Up Your Account</h2>
          <p className="text-slate-400 mt-1 mb-6">Enter your details to complete the invitation.</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive" className="bg-red-950/50 border-red-500 text-red-200">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName" className="text-slate-200">First Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    id="firstName"
                    placeholder="John"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName" className="text-slate-200">Last Name</Label>
                <Input
                  id="lastName"
                  placeholder="Doe"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  className="bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-slate-200">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="email"
                  type="email"
                  value={invitationData?.email || ''}
                  disabled
                  className="pl-10 bg-slate-600/50 border-slate-600 text-slate-300"
                />
              </div>
              <p className="text-xs text-slate-500">Email cannot be changed</p>
            </div>

            <p className="text-sm font-medium text-slate-200 pt-2">Set up your password</p>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-slate-200">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="pl-10 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  required
                  minLength={8}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-slate-200">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  className="pl-10 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-300 focus:outline-none"
                  tabIndex={-1}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full h-11 bg-slate-600 hover:bg-slate-500 text-white font-medium mt-2"
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
          </form>

          <p className="text-sm text-center text-slate-400 mt-6">
            Already have an account?{' '}
            <Link href="/login" className="text-blue-400 hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-8 pb-4">
        © {new Date().getFullYear()} Cushion Quoting System. All rights reserved.
      </p>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-[#e2e8f0] p-4"><Loader2 className="h-8 w-8 animate-spin text-slate-600" /></div>}>
      <AcceptInvitationForm />
    </Suspense>
  )
}
