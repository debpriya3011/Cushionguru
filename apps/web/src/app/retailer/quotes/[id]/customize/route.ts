import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: any) {
  try {
    const body = await req.json()

    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: { retailer: true }
    })

    if (!quote) {
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    if (quote.isCustomized) {
      return NextResponse.json({ error: "Already customized" }, { status: 400 })
    }

    // Add $10 PDF customization fee to the stored total
    const currentTotal = parseFloat(quote.total?.toString() || '0')
    const PDF_CUSTOMIZATION_FEE = 10
    const newTotal = currentTotal + PDF_CUSTOMIZATION_FEE

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        isCustomized: true,
        customizationSentAt: new Date(),
        pdfCustomization: body,
        status: "SENT",
        // NOTE: quote.total is intentionally NOT modified here.
        // The $10 PDF customization fee is added as a computed add-on at display and checkout time.
      }
    })

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Customization failed:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}
