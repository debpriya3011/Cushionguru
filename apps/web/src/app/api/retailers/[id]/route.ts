import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - Get single retailer
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Retailers can only view their own data
  if (session.user.role === 'RETAILER' && session.user.retailerId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const retailer = await prisma.retailer.findUnique({
      where: { id: params.id, deletedAt: null },
      include: {
        _count: {
          select: { quotes: true, orders: true },
        },
      },
    })

    if (!retailer) {
      return NextResponse.json(
        { error: 'Retailer not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(retailer)
  } catch (error) {
    console.error('Failed to fetch retailer:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retailer' },
      { status: 500 }
    )
  }
}

// PUT - Update retailer
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Only admin or the retailer themselves can update
  if (session.user.role === 'RETAILER' && session.user.retailerId !== params.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  try {
    const body = await req.json()

    // Retailers can't update certain fields
    const updateData: any = {}

    // Common fields both can update
    if (body.contactName) updateData.contactName = body.contactName
    if (body.phone) updateData.phone = body.phone
    if (body.address) updateData.address = body.address

    // Margins (Retailers can set their own)
    if (body.markupType !== undefined) updateData.markupType = body.markupType
    if (body.markupValue !== undefined) updateData.markupValue = body.markupValue

    // Branding & Label preferences
    if (body.labelPreference !== undefined) updateData.labelPreference = body.labelPreference
    if (body.labelTitle !== undefined) updateData.labelTitle = body.labelTitle
    if (body.labelStyle !== undefined) updateData.labelStyle = body.labelStyle
    if (body.labelPlacement !== undefined) updateData.labelPlacement = body.labelPlacement
    if (body.labelFileUrl !== undefined) updateData.labelFileUrl = body.labelFileUrl

    // PDF Customization
    if (body.pdfPreference !== undefined) updateData.pdfPreference = body.pdfPreference
    if (body.pdfCustomization !== undefined) updateData.pdfCustomization = body.pdfCustomization

    // Shipping Preferences
    if (body.shippingPreference !== undefined) updateData.shippingPreference = body.shippingPreference

    if (session.user.role === 'SUPER_ADMIN') {
      // Admin can update everything
      if (body.businessName) updateData.businessName = body.businessName
      if (body.status) updateData.status = body.status
      if (body.primaryColor) updateData.primaryColor = body.primaryColor
      if (body.secondaryColor) updateData.secondaryColor = body.secondaryColor
    }

    const retailer = await prisma.retailer.update({
      where: { id: params.id },
      data: updateData,
    })

    return NextResponse.json(retailer)
  } catch (error) {
    console.error('Failed to update retailer:', error)
    return NextResponse.json(
      { error: 'Failed to update retailer' },
      { status: 500 }
    )
  }
}

// DELETE - Soft delete retailer
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Soft delete - set deletedAt and deactivate
    await prisma.retailer.update({
      where: { id: params.id },
      data: {
        deletedAt: new Date(),
        status: 'INACTIVE',
      },
    })

    // Also deactivate the user
    await prisma.user.updateMany({
      where: { retailerId: params.id },
      data: { status: 'INACTIVE' },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete retailer:', error)
    return NextResponse.json(
      { error: 'Failed to delete retailer' },
      { status: 500 }
    )
  }
}
