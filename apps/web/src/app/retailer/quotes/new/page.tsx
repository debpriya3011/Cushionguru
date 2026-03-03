'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Calculator } from '@/components/calculator'
import { PriceDisplay } from '@/components/calculator/PriceDisplay'
import { Preview3D } from '@/components/calculator/Preview3D'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { toast } from '@/components/ui/use-toast'
import { Loader2, Save, FileText } from 'lucide-react'

export default function NewQuotePage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [calculations, setCalculations] = useState<any>(null)
  const [selections, setSelections] = useState<any>(null)
  const [customerData, setCustomerData] = useState<any>(null)
  const [saving, setSaving] = useState(false)

  const handleCalculate = (calc: any, sel: any) => {
    setCalculations(calc)
    setSelections(sel)
  }

  const handleSubmit = async (sel: any, calc: any, customer: any) => {
    setCustomerData(customer)
    await saveQuote(sel, calc, customer)
  }

  const saveQuote = async (sel?: any, calc?: any, customer?: any) => {
    const finalSelections = sel || selections
    const finalCalculations = calc || calculations
    const finalCustomer = customer || customerData

    if (!finalSelections || !finalCalculations || !finalCustomer) {
      toast({
        title: 'Missing Information',
        description: 'Please complete all steps before saving.',
        variant: 'destructive',
      })
      return
    }

    setSaving(true)

    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            selections: finalSelections,
            calculations: finalCalculations,
          }],
          customerDetails: finalCustomer,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create quote')
      }

      toast({
        title: 'Quote Created!',
        description: `Quote ${data.quoteNumber} has been saved.`,
      })

      router.push('/retailer/quotes')
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create quote',
        variant: 'destructive',
      })
    } finally {
      setSaving(false)
    }
  }

  if (!session?.user?.retailerId) {
    return <div>Loading...</div>
  }

  return (
    <div className="max-w-[1400px] mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">New Quote</h1>
        <p className="text-gray-600">
          Configure the cushion details below to generate a quote.
        </p>
      </div>

      <Calculator
        retailerId={session.user.retailerId}
        onCalculate={handleCalculate}
        onSubmit={handleSubmit}
        markup={session.user.retailer ? {
          type: session.user.retailer.markupType as 'PERCENTAGE' | 'FIXED',
          value: session.user.retailer.markupValue,
        } : undefined}
      />
    </div>
  )
}
