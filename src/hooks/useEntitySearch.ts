"use client"

import { useEffect, useState } from "react"
import type { EntityOption } from "@/types/recipe"

export const useEntitySearch = (searchUrl: string) => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<EntityOption[]>([])
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!query.trim()) return

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${searchUrl}?query=${encodeURIComponent(query)}`)
        if (!res.ok) throw new Error(`Search failed (${res.status})`)
        const data: EntityOption[] = await res.json()
        setError(null)
        setResults(data)
        setOpen(true)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Search failed"))
        setResults([])
        setOpen(true)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query, searchUrl])

  const active = query.trim().length > 0
  return {
    query,
    setQuery,
    results: active ? results : [],
    open: active ? open : false,
    setOpen,
    error: active ? error : null,
  }
}
