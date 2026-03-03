import { useState, useEffect, useCallback } from 'react'

interface QuoteFilters {
  status?: string
  search?: string
}

export function useQuotes(filters: QuoteFilters = {}) {
  const [quotes, setQuotes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchQuotes = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (filters.status) params.append('status', filters.status)

      const res = await fetch(`/api/quotes?${params}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to fetch quotes')
      }

      setQuotes(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [filters.status])

  useEffect(() => {
    fetchQuotes()
  }, [fetchQuotes])

  const createQuote = async (data: any) => {
    try {
      const res = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to create quote')
      }

      fetchQuotes()
      return result
    } catch (err: any) {
      throw err
    }
  }

  const updateQuote = async (id: string, data: any) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      const result = await res.json()

      if (!res.ok) {
        throw new Error(result.error || 'Failed to update quote')
      }

      fetchQuotes()
      return result
    } catch (err: any) {
      throw err
    }
  }

  const deleteQuote = async (id: string) => {
    try {
      const res = await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
      })

      if (!res.ok) {
        const result = await res.json()
        throw new Error(result.error || 'Failed to delete quote')
      }

      fetchQuotes()
    } catch (err: any) {
      throw err
    }
  }

  return {
    quotes,
    loading,
    error,
    refetch: fetchQuotes,
    createQuote,
    updateQuote,
    deleteQuote,
  }
}
