'use client'

import { useState, useMemo } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react'
import { Suspense } from 'react'

const LOGIN_VISIT_KEY = 'loginPageVisitKey'

function useRandomCurtainColor() {
  const [visitKey] = useState(() => {
    if (typeof window === 'undefined') return 0
    const next = (parseInt(sessionStorage.getItem(LOGIN_VISIT_KEY) || '0', 10)) + 1
    sessionStorage.setItem(LOGIN_VISIT_KEY, String(next))
    return next
  })
  return useMemo(() => {
    const hue = 100 + Math.floor(Math.random() * 60)
    const saturation = 65 + Math.floor(Math.random() * 25)
    const lightness = 42 + Math.floor(Math.random() * 18)
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`
  }, [visitKey])
}

function InteractiveCurtains({
  curtainColor,
  isOpen,
  onClickCurtains,
}: {
  curtainColor: string
  isOpen: boolean
  onClickCurtains: () => void
}) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 p-6 gap-6">
      <div className="text-center">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider mb-2">
          {isOpen ? 'CURTAINS OPEN' : 'CURTAINS CLOSED'}
        </p>
        <p className="text-[10px] text-slate-500">
          {isOpen ? 'Sign in form is ready' : 'Click the curtains to open and sign in'}
        </p>
      </div>

      {/* Window with cute curtains - whole area clickable */}
      <button
        type="button"
        onClick={onClickCurtains}
        className="relative w-full max-w-[280px] cursor-pointer rounded-xl overflow-hidden focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-700 transition-transform hover:scale-[1.02] active:scale-[0.99]"
        aria-label={isOpen ? 'Click to close curtains' : 'Click to open curtains'}
      >
        <svg
          viewBox="0 0 280 320"
          className="w-full h-auto pointer-events-none block"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id="curtainShade" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={curtainColor} stopOpacity="1" />
              <stop offset="100%" stopColor={curtainColor} stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="windowLight" x1="0.5" y1="0" x2="0.5" y2="1">
              <stop offset="0%" stopColor="#a5b4fc" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#c7d2fe" stopOpacity="0.25" />
            </linearGradient>
            <filter id="softShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          {/* Soft window frame */}
          <rect x="16" y="16" width="248" height="288" rx="12" fill="#a8a29e" stroke="#78716c" strokeWidth="2" filter="url(#softShadow)" />
          <rect x="24" y="24" width="232" height="272" rx="8" fill="#1e293b" stroke="#475569" strokeWidth="1" />

          {/* When closed: cute curtains with face */}
          {!isOpen && (
            <g>
              {/* Left panel - soft rounded */}
              <path
                d="M24 24 L24 296 L130 296 Q128 280 128 160 Q128 40 126 24 Z"
                fill="url(#curtainShade)"
                stroke="#64748b"
                strokeWidth="1.5"
                opacity="0.98"
              />
              {/* Right panel */}
              <path
                d="M256 24 L256 296 L150 296 Q152 280 152 160 Q152 40 154 24 Z"
                fill="url(#curtainShade)"
                stroke="#64748b"
                strokeWidth="1.5"
                opacity="0.98"
              />
              {/* Cute face in the middle - big eyes, blushing, smile */}
              <ellipse cx="115" cy="130" rx="14" ry="18" fill="#1e293b" />
              <ellipse cx="165" cy="130" rx="14" ry="18" fill="#1e293b" />
              <ellipse cx="118" cy="126" rx="4" ry="5" fill="white" opacity="0.95" />
              <ellipse cx="168" cy="126" rx="4" ry="5" fill="white" opacity="0.95" />
              <path d="M128 158 Q140 172 152 158" stroke="#1e293b" strokeWidth="3" fill="none" strokeLinecap="round" />
              <ellipse cx="100" cy="145" rx="16" ry="12" fill="#fda4af" opacity="0.45" />
              <ellipse cx="180" cy="145" rx="16" ry="12" fill="#fda4af" opacity="0.45" />
              {/* Small decorative dots on curtains */}
              <circle cx="60" cy="80" r="6" fill="white" opacity="0.2" />
              <circle cx="220" cy="100" r="5" fill="white" opacity="0.2" />
              <circle cx="70" cy="220" r="5" fill="white" opacity="0.15" />
              <circle cx="210" cy="200" r="6" fill="white" opacity="0.15" />
            </g>
          )}

          {/* When open: curtains tied to sides, window visible */}
          {isOpen && (
            <g>
              <rect x="24" y="24" width="232" height="272" fill="url(#windowLight)" rx="8" />
              <path d="M24 24 L24 296 L48 296 L48 24 Z" fill="url(#curtainShade)" stroke="#64748b" strokeWidth="1" opacity="0.98" />
              <path d="M256 24 L256 296 L232 296 L232 24 Z" fill="url(#curtainShade)" stroke="#64748b" strokeWidth="1" opacity="0.98" />
              <circle cx="60" cy="80" r="6" fill="white" opacity="0.2" />
              <circle cx="220" cy="100" r="5" fill="white" opacity="0.2" />
            </g>
          )}

          {/* Curtain rod - rounded */}
          <rect x="20" y="28" width="240" height="10" rx="5" fill="#d6d3d1" stroke="#a8a29e" strokeWidth="1" />
          {/* Rope with tassel */}
          <line x1="238" y1="38" x2="238" y2={isOpen ? 100 : 220} stroke="#d6d3d1" strokeWidth="5" strokeLinecap="round" />
          <circle cx="238" cy={isOpen ? 104 : 224} r="12" fill="#e7e5e4" stroke="#a8a29e" strokeWidth="2" />
        </svg>
      </button>

      <div className="text-center flex items-center gap-2">
        <span className="text-[10px] text-slate-500">Click curtains to open / close</span>
      </div>
    </div>
  )
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/'
  const curtainColor = useRandomCurtainColor()
  const [curtainsOpen, setCurtainsOpen] = useState(false)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
        callbackUrl,
      })
      if (result?.error) {
        setError(`Invalid email or password (${result.error})`)
        setLoading(false)
        return
      }
      if (!result?.ok) {
        setError('Login failed')
        setLoading(false)
        return
      }
      const fetchTime = new Date().getTime()
      const userRes = await fetch(`/api/auth/me?t=${fetchTime}`, { cache: 'no-store' })
      if (!userRes.ok) {
        setError('Logged in but failed to get user data')
        setLoading(false)
        return
      }
      const userData = await userRes.json()
      if (userData.role === 'SUPER_ADMIN') {
        router.push('/admin/dashboard')
      } else if (userData.role === 'RETAILER') {
        router.push('/retailer/dashboard')
      } else {
        router.push(callbackUrl)
      }
      router.refresh()
    } catch (err) {
      setError(`An error occurred: ${String(err)}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#e2e8f0] p-4">
      <div className="text-center mb-6 mt-6">
        <h1 className="text-3xl font-bold text-slate-800">Cushion Quoting</h1>
        <p className="text-slate-600 mt-2">Sign in to your account</p>
      </div>

      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-4xl flex flex-col md:flex-row rounded-xl overflow-hidden bg-slate-700 shadow-xl border border-slate-600">
          {/* Left: Login form - not in DOM when closed; slides in smoothly when open */}
          <div
            className={`overflow-hidden flex flex-col justify-center bg-slate-700 transition-[max-width,opacity] duration-500 ease-out ${
              curtainsOpen ? 'max-w-md opacity-100 flex-1 min-w-0' : 'max-w-0 opacity-0 flex-none'
            }`}
          >
            {curtainsOpen && (
              <div className="p-8 min-w-[280px] animate-in slide-in-from-left-8 fade-in duration-500">
                <h2 className="text-2xl font-bold text-white">Welcome back</h2>
                <p className="text-slate-400 mt-1 mb-6">Enter your credentials to access your account.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <Alert variant="destructive" className="bg-red-950/50 border-red-500 text-red-200">
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>{error}</AlertDescription>
                    </Alert>
                  )}

                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-200">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="email"
                        type="email"
                        placeholder="name@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="pl-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-200">Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <Input
                        id="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="pl-10 pr-10 bg-white border-slate-300 text-slate-900 placeholder:text-slate-500"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 focus:outline-none"
                        tabIndex={-1}
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
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
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>

                <p className="text-sm text-center text-slate-400 mt-6">
                  Don&apos;t have an account?{' '}
                  <Link href="/invite/accept" className="text-blue-400 hover:underline">
                    Accept an invitation
                  </Link>
                </p>
              </div>
            )}
          </div>

          {/* Right: Interactive curtains - click to open/close */}
          <div className={`flex-1 border-slate-600 bg-slate-700/90 min-h-[420px] flex flex-col transition-all duration-300 ${curtainsOpen ? 'md:border-l' : ''}`}>
            <InteractiveCurtains
              curtainColor={curtainColor}
              isOpen={curtainsOpen}
              onClickCurtains={() => setCurtainsOpen((v) => !v)}
            />
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-slate-500 mt-8 pb-4">
        © {new Date().getFullYear()} Cushion Quoting System. All rights reserved.
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-[#e2e8f0] p-4">
          <Loader2 className="h-8 w-8 animate-spin text-slate-600" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
