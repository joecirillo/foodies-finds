"use client"

import { useRef, useState } from "react"
import { isApiError, loadMoreRecipes } from "@/lib/api"
import type { RecipeSearchResult } from "@/types/recipe"

const FALLBACK_ERROR = "Couldn't load more recipes. Please try again."

export const useLoadMoreRecipes = (
  initialRecipes: RecipeSearchResult[],
  initialCursor: number | null,
) => {
  const [recipes, setRecipes] = useState(initialRecipes)
  const [nextCursor, setNextCursor] = useState(initialCursor)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const inFlight = useRef(false)

  const loadMore = async () => {
    if (nextCursor === null || inFlight.current) return
    inFlight.current = true
    setIsLoading(true)
    setError(null)
    try {
      const page = await loadMoreRecipes(nextCursor)
      setRecipes((current) => [...current, ...page.recipes])
      setNextCursor(page.nextCursor)
    } catch (err) {
      setError(isApiError(err) ? err.message : FALLBACK_ERROR)
    } finally {
      inFlight.current = false
      setIsLoading(false)
    }
  }

  return { recipes, hasMore: nextCursor !== null, isLoading, error, loadMore }
}
