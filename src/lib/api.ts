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
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }

  return res.json() as Promise<T>
}

export const getRecipe = (id: number | string) => apiFetch<Recipe>(`/recipe/get/${id}`)

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
