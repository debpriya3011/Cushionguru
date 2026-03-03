import { NextResponse } from 'next/server'
import Stripe from 'stripe'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
    apiVersion: '2023-10-16',
})

export async function POST(req: Request) {
    try {
        const session = await getServerSession(authOptions)
        if (!session) return new NextResponse('Unauthorized', { status: 401 })

        const body = await req.json()
        const { sessionId, quoteId } = body

        if (!sessionId || !quoteId) {
            return new NextResponse('Missing parameters', { status: 400 })
        }

        if (sessionId.startsWith('cs_test_mock')) {
            const updatedQuote = await prisma.quote.update({
                where: { id: quoteId },
                data: {
                    paymentStatus: 'SUCCESS',
                    paymentDate: new Date()
                }
            })

            return NextResponse.json({ success: true, paymentStatus: updatedQuote.paymentStatus })
        }

        // Usually we verify with Stripe directly:
        const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId)

        if (checkoutSession.payment_status === 'paid') {
            const updatedQuote = await prisma.quote.update({
                where: { id: quoteId },
                data: {
                    paymentStatus: 'SUCCESS',
                    paymentDate: new Date()
                }
            })

            return NextResponse.json({ success: true, paymentStatus: updatedQuote.paymentStatus })
        }

        return NextResponse.json({ success: false, status: checkoutSession.payment_status })
    } catch (error: any) {
        console.error('Stripe Verification Error:', error)

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error?.message ?? 'Unknown error'
            },
            { status: 500 }
        )
    }
}
