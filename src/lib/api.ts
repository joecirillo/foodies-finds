import type { ApiResponse, Recipe, AddRecipePayload, RecipeSearchResult } from "@/types/recipe"

async function apiFetch<T>(path: string): Promise<T> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
    },
    next: { revalidate: 60 },
  })

  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }

  const body: ApiResponse<T> = await res.json()
  return body.data
}

async function apiPost<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    method: "POST",
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const body = await res.json().catch(() => null)
    const message = body?.message ?? `API ${res.status}`
    const err = new Error(message)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }

  const body: ApiResponse<T> = await res.json()
  return body.data
}

export const getRecipe = (id: number | string) => apiFetch<Recipe>(`/recipe/get/${id}`)

export const listRecipes = () => apiFetch<RecipeSearchResult[]>("/recipe/list")

async function apiPatch<T>(path: string, payload: unknown): Promise<T> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    method: "PATCH",
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })

  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }

  const body: ApiResponse<T> = await res.json()
  return body.data
}

export const addRecipe = (payload: AddRecipePayload) => apiPost<Recipe>("/recipe/save", payload)

export const updateRecipe = (id: number | string, payload: AddRecipePayload) =>
  apiPatch<Recipe>(`/recipe/update/${id}`, payload)

export const searchRecipes = async (name: string): Promise<RecipeSearchResult[]> => {
  const res = await fetch(`/api/search/recipes?name=${encodeURIComponent(name)}`)
  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }
  return res.json()
}

export const filterRecipes = async (params: {
  name?: string
  cuisineId?: number
  tagId?: number
  ingredientId?: number
}): Promise<RecipeSearchResult[]> => {
  const qs = new URLSearchParams()
  if (params.name) qs.set("name", params.name)
  if (params.cuisineId) qs.set("cuisineId", String(params.cuisineId))
  if (params.tagId) qs.set("tagId", String(params.tagId))
  if (params.ingredientId) qs.set("ingredientId", String(params.ingredientId))

  const res = await fetch(`${process.env.API_URL}/recipe/search?${qs}`, {
    headers: { "x-api-key": process.env.API_KEY ?? "" },
    cache: "no-store",
  })

  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }

  const body: ApiResponse<RecipeSearchResult[]> = await res.json()
  return body.data
}
