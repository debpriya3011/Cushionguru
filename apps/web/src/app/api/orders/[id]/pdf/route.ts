import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateOrderPDF } from '@/lib/pdf-generator'

// GET - Generate PDF for order
export async function GET(
    req: NextRequest,
    { params }: { params: { id: string } }
) {
    const session = await getServerSession(authOptions)

    if (!session) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    try {
        const order = await prisma.order.findUnique({
            where: { id: params.id },
            include: {
                items: true,
                retailer: true,
            },
        })

        if (!order) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Check access
        if (session.user.role === 'RETAILER' && order.retailerId !== session.user.retailerId) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
        }

        const { searchParams } = new URL(req.url);
        const overrides = {
            pdfPreference: searchParams.get('pdfPreference') || undefined,
            pdfCustomization: {
                headerText: searchParams.get('headerText') || undefined,
                footerContact: searchParams.get('footerContact') || undefined,
                includeLogo: searchParams.has('includeLogo') ? searchParams.get('includeLogo') === 'true' : undefined
            }
        };

        // Generate PDF
        const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
        const pdfBuffer = await generateOrderPDF(order as any, order.retailer as any, overrides, isAdmin)

        // Return PDF as response
        const inline = searchParams.get('inline') === 'true';
        return new NextResponse(Buffer.from(pdfBuffer), {
            headers: {
                'Content-Type': 'application/pdf',
                'Content-Disposition': inline ? 'inline' : `attachment; filename="${order.orderNumber}.pdf"`,
            },
        })
    } catch (error) {
        console.error('Failed to generate PDF:', error)
        return NextResponse.json(
            { error: 'Failed to generate PDF' },
            { status: 500 }
        )
    }
}
