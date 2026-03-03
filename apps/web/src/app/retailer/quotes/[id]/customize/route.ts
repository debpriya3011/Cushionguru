import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest, { params }: any) {
  try {
    const body = await req.json()
    console.log("Customize POST body:", body)
    console.log("Quote ID param:", params.id)

    const quote = await prisma.quote.findUnique({
      where: { id: params.id }
    })

    if (!quote) {
      console.log("Quote not found")
      return NextResponse.json({ error: "Quote not found" }, { status: 404 })
    }

    if (quote.isCustomized) {
      console.log("Quote already customized")
      return NextResponse.json({ error: "Already customized" }, { status: 400 })
    }

    const updatedQuote = await prisma.quote.update({
      where: { id: params.id },
      data: {
        isCustomized: true,
        customizationSentAt: new Date(),
        pdfCustomization: body,
        status: "SENT"
      }
    })

    console.log("Quote updated:", updatedQuote)

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Customization failed:", error)
    return NextResponse.json({ error: "Failed" }, { status: 500 })
  }
}