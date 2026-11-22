import { apiError } from "@/lib/api-error"
import type { RecipeListPage, RecipeSearchResult } from "@/types/recipe"

export const loadMoreRecipes = async (cursor: string): Promise<RecipeListPage> => {
  const res = await fetch(`/api/recipes?cursor=${encodeURIComponent(cursor)}`)
  if (!res.ok) throw await apiError(res)
  return res.json()
}

export const searchRecipes = async (name: string): Promise<RecipeSearchResult[]> => {
  const res = await fetch(`/api/search/recipes?name=${encodeURIComponent(name)}`)
  if (!res.ok) throw await apiError(res)
  return res.json()
}
