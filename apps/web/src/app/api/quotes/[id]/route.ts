import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single quote
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
        retailer: session.user.role === 'SUPER_ADMIN' ? {
          select: { businessName: true },
        } : false,
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

    return NextResponse.json(quote)
  } catch (error) {
    console.error('Failed to fetch quote:', error)
    return NextResponse.json(
      { error: 'Failed to fetch quote' },
      { status: 500 }
    )
  }
}

// PUT - Update quote
export async function PUT(
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

    const body = await req.json()
    const { status, customerDetails } = body

    const updateData: any = {}
    if (status) {
      updateData.status = status
      if (status === 'SENT') {
        const setting = await prisma.systemSetting.findUnique({ where: { key: 'general' } })
        const config = (setting?.value as Record<string, any>) || {}
        if (config.autoApproveQuotes) {
          updateData.status = 'ACCEPTED'
        }
      }
    }
    if (customerDetails) {
      updateData.customerName = `${customerDetails.firstName} ${customerDetails.lastName}`
      updateData.customerEmail = customerDetails.email
      updateData.customerPhone = customerDetails.phone
      updateData.customerAddress = customerDetails.address
    }

    const updatedQuote = await prisma.$transaction(async (tx) => {
      const q = await tx.quote.update({
        where: { id: params.id },
        data: updateData,
        include: { items: true },
      })

      if (status === 'CONVERTED' && quote.status !== 'CONVERTED') {
        const orderNumber = `ORD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

        const order = await tx.order.create({
          data: {
            orderNumber,
            retailerId: quote.retailerId,
            quoteId: quote.id,
            customerName: quote.customerName,
            customerEmail: quote.customerEmail,
            customerPhone: quote.customerPhone,
            customerAddress: quote.customerAddress ?? undefined,
            subtotal: quote.subtotal,
            markupAmount: quote.markupAmount,
            total: quote.total,
            status: 'PENDING',
            items: {
              create: q.items.map((item: any) => ({
                productType: item.productType,
                shape: item.shape,
                dimensions: item.dimensions ?? {},
                foamType: item.foamType,
                fabricCode: item.fabricCode,
                zipperPosition: item.zipperPosition,
                piping: item.piping,
                ties: item.ties,
                fabricMeters: item.fabricMeters,
                quantity: item.quantity,
                unitPrice: item.unitPrice,
                totalPrice: item.totalPrice,
                instructions: item.instructions ?? undefined,
                attachmentUrls: item.attachmentUrls ?? [],
              }))
            }
          }
        });

        await tx.quote.update({
          where: { id: quote.id },
          data: { convertedToOrderId: order.id }
        });
      }

      // Notify Super Admins internally explicitly if converted
      if (body.status === 'CONVERTED') {
        const admins = await tx.user.findMany({ where: { role: 'SUPER_ADMIN' } });
        if (admins.length > 0) {
          await tx.notification.createMany({
            data: admins.map((admin: { id: any }) => ({
              userId: admin.id,
              title: 'Quote Converted to Order',
              message: `Quote (${quote.quoteNumber}) has been accepted and converted.`,
              link: `/admin/orders`
            }))
          });
        }
      }

      // Notify Retailer of status changes
      if (body.status && body.status !== quote.status) {
        const retailerUser = await tx.user.findFirst({ where: { retailerId: quote.retailerId } });
        if (retailerUser) {
          await tx.notification.create({
            data: {
              userId: retailerUser.id,
              title: `Quote Status Updated`,
              message: `Your Quote (${quote.quoteNumber}) status is now ${body.status}.`,
              link: `/retailer/quotes/${quote.id}`
            }
          });
        }
      }

      return q;
    });

    return NextResponse.json(updatedQuote)
  } catch (error) {
    console.error('Failed to update quote:', error)
    return NextResponse.json(
      { error: 'Failed to update quote' },
      { status: 500 }
    )
  }
}

// DELETE - Delete quote
export async function DELETE(
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

    await prisma.quote.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete quote:', error)
    return NextResponse.json(
      { error: 'Failed to delete quote' },
      { status: 500 }
    )
  }
}
