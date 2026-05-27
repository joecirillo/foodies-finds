"use client"

import { useState, useEffect } from "react"
import { searchRecipes } from "@/lib/api"
import type { RecipeSearchResult } from "@/types/recipe"

export const useRecipeSearch = () => {
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<RecipeSearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (query.length < 2) return

    const timer = setTimeout(async () => {
      setLoading(true)
      setError(null)
      try {
        const data = await searchRecipes(query)
        setResults(data)
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Unknown error"))
        setResults([])
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  const active = query.length >= 2
  return { query, setQuery, results: active ? results : [], loading: active ? loading : false, error: active ? error : null }
}
