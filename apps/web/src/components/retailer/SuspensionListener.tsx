'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export function SuspensionListener({ isCurrentlySuspended }: { isCurrentlySuspended: boolean }) {
    const router = useRouter()

    useEffect(() => {
        let isMounted = true

        const checkStatus = async () => {
            try {
                const res = await fetch('/api/auth/status')
                if (!res.ok) return

                const data = await res.json()

                if (isMounted && data.hasOwnProperty('isSuspended') && isCurrentlySuspended !== data.isSuspended) {
                    // Status changed! Force Next.js to re-evaluate the layout
                    router.refresh()
                }
            } catch (err) {
                console.error('Failed to check suspension status', err)
            }
        }

        // Poll every 30 seconds — still near-real-time but 3x less DB pressure
        // vs the previous 10s when 30+ retailers are online simultaneously
        const interval = setInterval(checkStatus, 30000)
        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [router, isCurrentlySuspended])

    return null
}
