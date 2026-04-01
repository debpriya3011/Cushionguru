import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NewQuoteClient } from './NewQuoteClient'
import { prisma } from '@/lib/prisma'

export default async function NewQuotePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.retailerId) {
    redirect('/login?callbackUrl=/retailer/quotes/new')
  }

  const retailer = await prisma.retailer.findUnique({
    where: { id: session.user.retailerId },
    select: { markupType: true, markupValue: true }
  })

  return (
    <NewQuoteClient
      retailerId={session.user.retailerId!}
      markup={
        retailer?.markupType && retailer?.markupValue !== undefined
          ? {
            type: retailer.markupType as 'PERCENTAGE' | 'FIXED',
            value: Number(retailer.markupValue),
          }
          : undefined
      }
    />
  )
}