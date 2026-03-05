'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'

import { Suspense } from 'react'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [debugInfo, setDebugInfo] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setDebugInfo('')

    // DEBUG: Log what we're sending
    console.log('🔍 Attempting login with:', { email, passwordLength: password.length })
    setDebugInfo(`Sending: ${email} / Password length: ${password.length}`)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })

      // DEBUG: Log the full result
      console.log('📊 Login result:', result)
      setDebugInfo(prev => `${prev}\nResult: ${JSON.stringify(result, null, 2)}`)

      if (result?.error) {
        console.error('❌ Login error:', result.error)
        setDebugInfo(prev => `${prev}\nError: ${result.error}`)
        setError(`Invalid email or password (${result.error})`)
        setLoading(false)
        return
      }

      if (!result?.ok) {
        console.error('❌ Result not OK:', result)
        setDebugInfo(prev => `${prev}\nResult not OK`)
        setError('Login failed - check console')
        setLoading(false)
        return
      }

      console.log('✅ Login OK, fetching user session...')
      setDebugInfo(prev => `${prev}\nLogin OK, fetching user session...`)

      // Fetch user to determine redirect (bypass next-auth's aggressive client session caching)
      const fetchTime = new Date().getTime();
      const userRes = await fetch(`/api/auth/me?t=${fetchTime}`, { cache: 'no-store' });

      if (!userRes.ok) {
        console.error('❌ Failed to fetch user session')
        setDebugInfo(prev => `${prev}\nFailed to fetch user session from API`)
        setError('Logged in but failed to get user data')
        setLoading(false)
        return
      }

      const userData = await userRes.json()
      console.log('👤 User data:', userData)
      setDebugInfo(prev => `${prev}\nUser: ${JSON.stringify(userData, null, 2)}`)

      if (userData.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard')
      } else if (userData.role === 'RETAILER') {
        router.push('/retailer/dashboard')
      } else {
        router.push(callbackUrl)
      }

      router.refresh()
    } catch (err) {
      console.error('💥 Exception:', err)
      setDebugInfo(prev => `${prev}\nException: ${String(err)}`)
      setError(`An error occurred: ${String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900">Cushion Quoting</h1>
          <p className="text-slate-600 mt-2">Sign in to your account</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>
              Enter your credentials to access your account
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

              {/* DEBUG INFO - Remove after fixing */}
              {debugInfo && (
                <div className="bg-gray-100 p-2 rounded text-xs font-mono whitespace-pre-wrap">
                  <strong>Debug:</strong>{'\n'}{debugInfo}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
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
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>

              <p className="text-sm text-center text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/invite/accept"
                  className="text-blue-600 hover:underline"
                >
                  Accept an invitation
                </Link>
              </p>
            </CardFooter>
          </form>
        </Card>

        <p className="text-center text-sm text-gray-500 mt-8">
          © {new Date().getFullYear()} Cushion Quoting System. All rights reserved.
        </p>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-4"><Loader2 className="h-8 w-8 animate-spin text-blue-500" /></div>}>
      <LoginForm />
    </Suspense>
  )
}