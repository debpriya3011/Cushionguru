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
        const { quoteId } = body

        const quote = await prisma.quote.findUnique({
            where: { id: quoteId },
            include: { retailer: true, items: true }
        })

        if (!quote) return new NextResponse('Not found', { status: 404 })

        // Charge = (total - retailer margin) + service fees
        // Uses snapshotted quote preferences — immune to later settings changes
        const markupAmount = parseFloat(quote.markupAmount?.toString() || '0')
        let totalAmount = parseFloat(quote.total.toString()) - markupAmount

        // PDF fee ($10)
        if (quote.pdfPreference === 'ALWAYS') {
            totalAmount += 10
        } else if (quote.isCustomized) {
            totalAmount += 10
        }

        // Fabric label fee ($8 × total qty)
        if (quote.labelPreference === 'ALWAYS' || quote.labelPreference === 'PER_ORDER') {
            const qty = quote.items?.reduce((acc, item) => acc + item.quantity, 0) || 0
            totalAmount += 8 * qty
        }

        // HARDCODED DEDUCTION FOR TESTING (deducting $1000 or forcing checkout amount to be small)
        // Adjust this number as needed for your test
        // totalAmount = Math.max(1, totalAmount - 247.1);

        const base_url = process.env.NEXTAUTH_URL as string

        const checkoutSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [
                {
                    price_data: {
                        currency: 'usd',
                        product_data: {
                            name: `Order for Quote ${quote.quoteNumber}`,
                        },
                        unit_amount: Math.round(totalAmount * 100),
                    },
                    quantity: 1,
                },
            ],
            mode: 'payment',
            success_url: `${base_url}/retailer/quotes/${quote.id}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${base_url}/retailer/quotes/${quote.id}?payment=cancelled`,
            client_reference_id: quote.id,
        })

        // ✅ Save Checkout Session ID (NOT PaymentIntent ID)
        await prisma.quote.update({
            where: { id: quote.id },
            data: {
                stripePaymentIntentId: checkoutSession.id,
                paymentStatus: 'PENDING',
            },
        })

        // ✅ Return URL for redirect (modern Stripe way)
        return NextResponse.json({
            url: checkoutSession.url,
            id: checkoutSession.id,
        })

    } catch (error: any) {
        console.error('Stripe Checkout Error:', error)

        return NextResponse.json(
            {
                error: 'Internal Server Error',
                message: error?.message ?? 'Unknown error',
            },
            { status: 500 }
        )
    }
}