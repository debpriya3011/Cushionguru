import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== 'SUPER_ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key: 'general' }
        })

        const config = setting?.value as Record<string, any> || {}

        return NextResponse.json({
            showRetailerPriceBreakdown: config.showRetailerPriceBreakdown ?? false,
            autoApproveQuotes: config.autoApproveQuotes ?? false,
            companyName: config.companyName ?? 'Cushion SaaS Admin',
            supportEmail: config.supportEmail ?? 'support@yourcushiondomain.com',
            logoUrl: config.logoUrl ?? '',
        })
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (session?.user?.role !== 'SUPER_ADMIN') {
            return new NextResponse('Unauthorized', { status: 401 })
        }

        const body = await req.json()

        // Merge with existing settings to avoid losing fields
        const existing = await prisma.systemSetting.findUnique({
            where: { key: 'general' }
        })
        const existingConfig = (existing?.value as Record<string, any>) || {}
        const merged = { ...existingConfig, ...body }

        await prisma.systemSetting.upsert({
            where: { key: 'general' },
            update: { value: merged },
            create: { key: 'general', value: merged }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
