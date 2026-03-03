import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { NewQuoteClient } from './NewQuoteClient'

export default async function NewQuotePage() {
  const session = await getServerSession(authOptions)

  if (!session || !session.user?.retailerId) {
    redirect('/login?callbackUrl=/retailer/quotes/new')
  }

  return (
    <NewQuoteClient
      retailerId={session.user.retailerId!}
      markup={
        session.user.retailer?.markupType && session.user.retailer?.markupValue !== undefined
          ? {
            type: session.user.retailer.markupType as 'PERCENTAGE' | 'FIXED',
            value: session.user.retailer.markupValue,
          }
          : undefined
      }
    />
  )
}

