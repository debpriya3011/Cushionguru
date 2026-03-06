import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

// Public endpoint to get platform branding (logo, company name)
// Used by AdminHeader and RetailerHeader
export async function GET() {
    try {
        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'general' }
        })

        const config = setting?.value as Record<string, any> || {}

        return NextResponse.json({
            logoUrl: config.logoUrl || '',
            companyName: config.companyName || 'Cushion Quoting',
            supportEmail: config.supportEmail || 'support@cushionsaas.com',
        })
    } catch (error) {
        console.error(error)
        return NextResponse.json({
            logoUrl: '',
            companyName: 'Cushion Quoting',
            supportEmail: 'support@cushionsaas.com',
        })
    }
}
