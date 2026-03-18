import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { calculateQuote, applyMarkup } from '@calculator-engine'

// Generate unique quote number
function generateQuoteNumber(): string {
  const prefix = 'QUO'
  const year = new Date().getFullYear()
  const random = Math.floor(1000 + Math.random() * 9000)
  return `${prefix}-${year}-${random}`
}

// Single source of truth for the final displayed total
// Use quote's snapshotted preferences; fall back to live retailer prefs for old quotes
function computeFinalTotal(quote: any): number {
  const base = parseFloat(quote.total?.toString() || '0')
  const pdfPref = quote.pdfPreference ?? quote.retailer?.pdfPreference
  const labelPref = quote.labelPreference ?? quote.retailer?.labelPreference

  // PDF fee ($10)
  let pdfFee = 0
  if (pdfPref === 'ALWAYS' || quote.isCustomized) {
    pdfFee = 10
  } else if (pdfPref === 'PER_ORDER' && quote.status === 'DRAFT') {
    pdfFee = 10  // Default toggle is ON in the detail page
  }

  // Fabric label fee ($8 × qty) — added for ALWAYS or opted-in PER_ORDER, shown until paid
  let fabricFee = 0
  if (quote.paymentStatus !== 'SUCCESS') {
    if (labelPref === 'ALWAYS') {
      const qty = (quote.items ?? []).reduce((acc: number, i: any) => acc + i.quantity, 0)
      fabricFee = 8 * qty
    } else if (labelPref === 'PER_ORDER') {
      // PER_ORDER on the quote itself means the retailer opted IN for this quote
      const qty = (quote.items ?? []).reduce((acc: number, i: any) => acc + i.quantity, 0)
      fabricFee = 8 * qty
    }
  }

  return base + pdfFee + fabricFee
}

// GET - List quotes for retailer
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where: any = {}

    if (session.user.role === 'RETAILER') {
      where.retailerId = session.user.retailerId
    }

    if (status) {
      where.status = status
    }

    const quotes = await prisma.quote.findMany({
      where,
      select: {
        id: true,
        quoteNumber: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        customerAddress: true,
        status: true,
        subtotal: true,
        markupAmount: true,
        total: true,
        pdfPreference: true,
        labelPreference: true,
        isCustomized: true,
        paymentStatus: true,
        convertedToOrderId: true,
        createdAt: true,
        updatedAt: true,
        retailerId: true,
        retailer: {
          select: {
            businessName: true,
            pdfPreference: true,
            labelPreference: true,
          }
        },
        // Only fetch quantity from items — needed for fee calculation and counts
        items: {
          select: { id: true, quantity: true }
        },
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Attach server-computed finalTotal to every quote so clients need no fee logic
    const result = quotes.map((q: any) => ({ ...q, finalTotal: computeFinalTotal(q) }))
    return NextResponse.json(result)
  } catch (error) {
    console.error('Failed to fetch quotes:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quotes' },
      { status: 500 }
    )
  }
}

// POST - Create new quote
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { items, customerDetails } = body

    // Get retailer for markup calculation
    let retailerId = session.user.retailerId

    if (session.user.role === 'SUPER_ADMIN' && body.retailerId) {
      retailerId = body.retailerId
    }

    if (!retailerId) {
      return NextResponse.json(
        { error: 'Retailer not found' },
        { status: 404 }
      )
    }

    const retailer = await prisma.retailer.findUnique({
      where: { id: retailerId },
    })

    if (!retailer) {
      return NextResponse.json(
        { error: 'Retailer not found' },
        { status: 404 }
      )
    }

    // Calculate each item
    const quoteItems = []
    let subtotal = 0

    for (const item of items) {
      const calc = item.calculations || calculateQuote(item.selections)

      // Calculate base price
      const rawPrice = calc.baseSubtotal

      quoteItems.push({
        productType: item.selections.productType,
        shape: item.selections.shape,
        dimensions: item.selections.dimensions,
        foamType: item.selections.foamType,
        fabricCode: item.selections.fabricCode,
        fabricName: item.selections.fabricCode.split('_').pop(),
        zipperPosition: item.selections.zipperPosition,
        piping: item.selections.piping,
        ties: item.selections.ties,
        fabricMeters: calc.fabricMeters,
        quantity: item.selections.quantity,
        baseSewingCost: calc.sewingCost,
        baseFiberfillCost: calc.fiberfillCost,
        basePipingCost: calc.pipingCost,
        baseTiesCost: calc.tiesCost,
        baseFabricCost: calc.fabricCost,
        baseSubtotal: calc.baseSubtotal,
        unitPrice: rawPrice / item.selections.quantity,
        totalPrice: rawPrice,
        instructions: item.selections.instructions,
        attachmentUrls: item.selections.attachments || [],
      })

      subtotal += rawPrice
    }

    const markupAmount = retailer.markupType === 'PERCENTAGE'
      ? subtotal * (Number(retailer.markupValue) / 100)
      : Number(retailer.markupValue) * items.length

    const finalCalculatedTotal = subtotal + markupAmount;

    // Create quote
    const quote = await prisma.quote.create({
      data: {
        quoteNumber: generateQuoteNumber(),
        retailerId,
        customerName: `${customerDetails.firstName} ${customerDetails.lastName}`,
        customerEmail: customerDetails.email,
        customerPhone: customerDetails.phone,
        customerAddress: customerDetails.address,
        items: {
          create: quoteItems,
        },
        subtotal,
        markupAmount,
        total: finalCalculatedTotal,
        status: 'DRAFT',
        // Snapshot preferences at creation time — settings changes won't affect existing quotes
        labelPreference: retailer.labelPreference,
        pdfPreference: retailer.pdfPreference,
      },
      include: {
        items: true,
      },
    })

    // Create notifications for ALL super admins
    const admins = await prisma.user.findMany({
      where: { role: 'SUPER_ADMIN' }
    });

    if (admins.length > 0) {
      await prisma.notification.createMany({
        data: admins.map(admin => ({
          userId: admin.id,
          title: 'New Quote Created',
          message: `${retailer.businessName} has generated a new Quote (${quote.quoteNumber}).`,
          link: `/admin/quotes/${quote.id}`
        }))
      });
    }

    return NextResponse.json(quote, { status: 201 })
  } catch (error) {
    console.error('Failed to create quote:', error)
    return NextResponse.json(
      { error: 'Failed to create quote' },
      { status: 500 }
    )
  }
}
