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

        return NextResponse.json({
            showRetailerPriceBreakdown: config.showRetailerPriceBreakdown ?? false,
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            showRetailerPriceBreakdown: false,
        })
    }
}
