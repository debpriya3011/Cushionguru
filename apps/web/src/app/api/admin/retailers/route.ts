import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { hash } from 'bcryptjs'
import { randomBytes } from 'crypto'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// GET - List all retailers
export async function GET() {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const retailers = await prisma.retailer.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { quotes: true, orders: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json(retailers)
  } catch (error) {
    console.error('Failed to fetch retailers:', error)
    return NextResponse.json(
      { error: 'Failed to fetch retailers' },
      { status: 500 }
    )
  }
}

// POST - Create new retailer
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  
  if (!session || session.user.role !== 'SUPER_ADMIN') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const body = await req.json()
    const { businessName, contactName, email, phone, markupType, markupValue, address } = body

    // Validate required fields
    if (!businessName || !contactName || !email) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Check if email exists
    const existingRetailer = await prisma.retailer.findUnique({
      where: { email },
    })

    if (existingRetailer) {
      return NextResponse.json(
        { error: 'A retailer with this email already exists' },
        { status: 400 }
      )
    }

    // Check retailer limit
    const retailerCount = await prisma.retailer.count({
      where: { deletedAt: null },
    })

    const maxRetailers = parseInt(process.env.MAX_RETAILERS || '30')
    if (retailerCount >= maxRetailers) {
      return NextResponse.json(
        { error: `Maximum retailer limit (${maxRetailers}) reached` },
        { status: 400 }
      )
    }

    // Create retailer
    const retailer = await prisma.retailer.create({
      data: {
        businessName,
        contactName,
        email,
        phone,
        markupType: markupType || 'PERCENTAGE',
        markupValue: markupValue || 20,
        address: address || undefined,
        status: 'ACTIVE',
      },
    })

    // Generate invitation token
    const invitationToken = randomBytes(32).toString('hex')
    const tempPassword = randomBytes(16).toString('hex')

    // Create user account
    await prisma.user.create({
      data: {
        email,
        password: await hash(tempPassword, 10),
        role: 'RETAILER',
        status: 'PENDING',
        retailerId: retailer.id,
        invitationToken,
        invitationExpires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        invitedById: session.user.id,
      },
    })

    // TODO: Send invitation email
    // await sendInvitationEmail(email, businessName, invitationToken)

    const invitationUrl = `${process.env.NEXTAUTH_URL}/invite/accept?token=${invitationToken}`

    return NextResponse.json(
      { retailer, invitationToken, invitationUrl },
      { status: 201 }
    )
  } catch (error) {
    console.error('Failed to create retailer:', error)
    return NextResponse.json(
      { error: 'Failed to create retailer' },
      { status: 500 }
    )
  }
}
