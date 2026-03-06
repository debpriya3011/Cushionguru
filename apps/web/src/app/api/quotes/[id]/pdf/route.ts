import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { generateQuotePDF } from '@/lib/pdf-generator'

// GET - Generate PDF for quote
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const quote = await prisma.quote.findUnique({
      where: { id: params.id },
      include: {
        items: true,
        retailer: true,
      },
    })

    if (!quote) {
      return NextResponse.json(
        { error: 'Quote not found' },
        { status: 404 }
      )
    }

    // Check access
    if (session.user.role === 'RETAILER' && quote.retailerId !== session.user.retailerId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Extract potential query param overrides
    const { searchParams } = new URL(req.url);

    // If quote is customized, use stored customization from database
    let customization = quote.pdfCustomization || {};

    // Use quote's own preference if set (from customization), otherwise use retailer's
    const pdfPreference = quote.pdfPreference || quote.retailer.pdfPreference || 'NONE';

    // Allow query params to override stored customization (for preview mode)
    const overrides = {
      pdfPreference: searchParams.get('pdfPreference') || pdfPreference,
      labelPreference: (quote as any).labelPreference || quote.retailer.labelPreference || 'NONE',
      pdfCustomization: {
        headerText: searchParams.get('headerText') || (customization as any)?.headerText || undefined,
        footerContact: searchParams.get('footerContact') || (customization as any)?.footerContact || undefined,
        includeLogo: searchParams.has('includeLogo') ? searchParams.get('includeLogo') === 'true' : (customization as any)?.includeLogo,
        includeLabel: searchParams.has('includeLabel') ? searchParams.get('includeLabel') === 'true' : (customization as any)?.includeLabel,
        labelText: searchParams.get('labelText') || (customization as any)?.labelText || undefined
      }
    };

    // Generate PDF
    const isAdmin = session.user.role === 'ADMIN' || session.user.role === 'SUPER_ADMIN';
    const pdfBuffer = await generateQuotePDF(quote as any, quote.retailer as any, overrides, isAdmin)

    // Return PDF as response
    const inline = searchParams.get('inline') === 'true';
    return new NextResponse(Buffer.from(pdfBuffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': inline ? 'inline' : `attachment; filename="${quote.quoteNumber}.pdf"`,
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
