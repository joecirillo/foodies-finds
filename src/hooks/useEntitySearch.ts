"use client"

import { useEffect, useState } from "react"
import type { EntityOption } from "@/types/recipe"

export const useEntitySearch = (searchUrl: string) => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<EntityOption[]>([])
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!query.trim()) return

    const timer = setTimeout(async () => {
      const res = await fetch(`${searchUrl}?query=${encodeURIComponent(query)}`)
      const data: EntityOption[] = await res.json()
      setResults(data)
      setOpen(true)
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
  }
}
