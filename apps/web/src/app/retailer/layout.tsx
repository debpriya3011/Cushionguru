import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { RetailerSidebar } from '@/components/retailer/RetailerSidebar'
import { RetailerHeader } from '@/components/retailer/RetailerHeader'

export default async function RetailerLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession(authOptions)

  if (!session || session.user.role !== 'RETAILER') {
    redirect('/login?callbackUrl=/retailer/dashboard')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <RetailerHeader user={session.user} />
      <div className="flex">
        <RetailerSidebar />
        <main className="flex-1 p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
