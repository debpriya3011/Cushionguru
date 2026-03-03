import { useState, useCallback, useEffect } from 'react'
import { CalculatorSelections, CalculatedValues } from '@shared-types/calculator'
import { calculateQuote, validateSelections } from '@calculator-engine'

interface UseCalculatorOptions {
  retailerId: string
  initialSelections?: Partial<CalculatorSelections>
}

export function useCalculator({ retailerId, initialSelections }: UseCalculatorOptions) {
  const [selections, setSelections] = useState<CalculatorSelections>({
    productType: 'sofa-cushion',
    shape: 'Rectangle',
    dimensions: {
      length: 20,
      width: 15,
      thickness: 3,
      quantity: 1,
    },
    foamType: 'High Density Foam',
    fabricCode: 'SOLID_3737_ARDOISE',
    zipperPosition: 'No Zipper',
    piping: 'No Piping',
    ties: 'No ties',
    quantity: 1,
    ...initialSelections,
  })

  const [calculations, setCalculations] = useState<CalculatedValues | null>(null)
  const [errors, setErrors] = useState<Array<{ field: string; message: string }>>([])
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch calculator config
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch(`/api/retailers/${retailerId}/calculator-config`)
        const data = await res.json()
        if (data.config) {
          setConfig(data.config)
        }
      } catch (error) {
        console.error('Failed to fetch calculator config:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchConfig()
  }, [retailerId])

  // Calculate on selection changes
  useEffect(() => {
    const validationErrors = validateSelections(selections)
    setErrors(validationErrors)

    if (validationErrors.length === 0) {
      const calc = calculateQuote(selections)
      setCalculations(calc)
    }
  }, [selections])

  const updateSelection = useCallback(<K extends keyof CalculatorSelections>(
    key: K,
    value: CalculatorSelections[K]
  ) => {
    setSelections(prev => ({ ...prev, [key]: value }))
  }, [])

  const updateDimensions = useCallback((dims: Partial<CalculatorSelections['dimensions']>) => {
    setSelections(prev => ({
      ...prev,
      dimensions: { ...prev.dimensions, ...dims }
    }))
  }, [])

  const reset = useCallback(() => {
    setSelections({
      productType: 'sofa-cushion',
      shape: 'Rectangle',
      dimensions: {
        length: 20,
        width: 15,
        thickness: 3,
        quantity: 1,
      },
      foamType: 'High Density Foam',
      fabricCode: 'SOLID_3737_ARDOISE',
      zipperPosition: 'No Zipper',
      piping: 'No Piping',
      ties: 'No ties',
      quantity: 1,
    })
  }, [])

  return {
    selections,
    calculations,
    errors,
    config,
    loading,
    updateSelection,
    updateDimensions,
    reset,
  }
}
