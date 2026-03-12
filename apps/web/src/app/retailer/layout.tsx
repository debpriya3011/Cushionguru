import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RetailerSidebar } from '@/components/retailer/RetailerSidebar'
import { RetailerHeader } from '@/components/retailer/RetailerHeader'
import { prisma } from '@/lib/prisma'
import { SuspendedScreen } from './SuspendedScreen'
import { SuspensionListener } from '@/components/retailer/SuspensionListener'

export default async function RetailerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'RETAILER') {
    redirect('/login?callbackUrl=/retailer/dashboard')
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true, retailer: { select: { status: true } } }
  })

  const isSuspended = currentUser?.status === 'SUSPENDED' || currentUser?.retailer?.status === 'SUSPENDED'

  // Prevent accessing dashboard metrics when suspended
  if (isSuspended) {
    return (
      <>
        <SuspensionListener isCurrentlySuspended={true} />
        <SuspendedScreen />
      </>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <SuspensionListener isCurrentlySuspended={false} />
      <RetailerHeader user={session.user} />
      <div className="flex">
        <RetailerSidebar />
        <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-4rem)]">
          {children}
        </main>
      </div>
    </div>
  )
}
