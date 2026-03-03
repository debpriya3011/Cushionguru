import { useSession, signIn, signOut, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const { data: session, status } = useSession()
  const router = useRouter()

  const isLoading = status === 'loading'
  const isAuthenticated = status === 'authenticated'
  const isAdmin = session?.user?.role === 'SUPER_ADMIN'
  const isRetailer = session?.user?.role === 'RETAILER'

  const login = async (email: string, password: string) => {
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    if (result?.error) {
      return { success: false, error: result.error }
    }

    // Get user role for redirect
    const fetchTime = new Date().getTime();
    const userRes = await fetch(`/api/auth/me?t=${fetchTime}`, { cache: 'no-store' });
    const user = await userRes.json();

    const redirectUrl = user.role === 'SUPER_ADMIN'
      ? '/admin/dashboard'
      : '/retailer/dashboard'

    router.push(redirectUrl)
    router.refresh()

    return { success: true }
  }

  const logout = async () => {
    await signOut({ callbackUrl: '/login' })
  }

  return {
    session,
    isLoading,
    isAuthenticated,
    isAdmin,
    isRetailer,
    user: session?.user,
    login,
    logout,
  }
}
