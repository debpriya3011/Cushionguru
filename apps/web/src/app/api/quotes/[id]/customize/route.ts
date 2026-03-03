import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    console.log("Customize POST body:", body)
    console.log("Quote ID param:", params.id)

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { retailer: true }
    })

    if (!quote) {
      console.log("Quote not found")
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    // Check access control
    if (session.user.role === 'RETAILER' && quote.retailerId !== session.user.retailerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    if (quote.isCustomized) {
      console.log("Quote already customized")
      return NextResponse.json({ error: "Quote already customized" }, { status: 400 })
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        isCustomized: true,
        customizationSentAt: new Date(),
        pdfCustomization: body,
        pdfPreference: 'ALWAYS',  // Enable PDF customization for this quote
        status: "SENT"
      }
    })

    console.log("Quote updated:", updatedQuote)

    // Create notifications for all super admins
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' }
    })

    if (admins.length > 0) {
      await Promise.all(
        admins.map(admin =>
          prisma.notification.create({
            data: {
              userId: admin.id,
              title: 'Quote Customized',
              message: `Retailer "${quote.retailer?.businessName}" has customized quote ${quote.quoteNumber}`,
              link: `/admin/quotes/${quote.id}`
            }
          })
        )
      )
    }

    return NextResponse.json({ success: true, quote: updatedQuote })

  } catch (error) {
    console.error("Customization failed:", error)
    return NextResponse.json(
      { error: "Failed to customize quote" },
      { status: 500 }
    )
  }
}
