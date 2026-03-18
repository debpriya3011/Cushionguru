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

        // Check every 10 seconds for real-time vibe
        const interval = setInterval(checkStatus, 10000)
        return () => {
            isMounted = false
            clearInterval(interval)
        }
    }, [router, isCurrentlySuspended])

    return null
}
