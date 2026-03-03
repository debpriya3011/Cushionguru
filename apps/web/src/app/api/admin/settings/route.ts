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

        await prisma.systemSetting.upsert({
            where: { key: 'general' },
            update: { value: body },
            create: { key: 'general', value: body }
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error(error)
        return new NextResponse('Internal Error', { status: 500 })
    }
}
