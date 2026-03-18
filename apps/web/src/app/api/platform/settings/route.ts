import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint to get non-sensitive platform settings
// Used by retailer-facing components (e.g. PriceDisplay) to read admin toggles
export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'general' }
        })

        const config = setting?.value as Record<string, any> || {}

        const response = NextResponse.json({
            showRetailerPriceBreakdown: config.showRetailerPriceBreakdown ?? false,
        })
        // Cache for 60 seconds — settings change rarely, safe to cache per user.
        // stale-while-revalidate allows instant response while refreshing in background.
        response.headers.set('Cache-Control', 'private, max-age=60, stale-while-revalidate=120')
        return response
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            showRetailerPriceBreakdown: false,
        })
    }
}
