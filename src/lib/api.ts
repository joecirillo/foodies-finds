import type {
  ApiResponse,
  Recipe,
  SaveRecipeRequest,
  EditRecipeRequest,
  RecipeSearchResult,
  Cuisine,
  Ingredient,
  Tag,
  Unit,
  PresignedImageUpload,
} from "@/types/recipe"

async function apiFetch<T>(path: string, revalidate: number | false = 60): Promise<T> {
  const res = await fetch(`${process.env.API_URL}${path}`, {
    headers: {
      "x-api-key": process.env.API_KEY ?? "",
    },
    next: { revalidate },
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

export const getRecipe = (id: number | string) => apiFetch<Recipe>(`/recipes/${id}`)

export const listRecipes = () => apiFetch<RecipeSearchResult[]>("/recipes")

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

export const addRecipe = (payload: SaveRecipeRequest) => apiPost<Recipe>("/recipes", payload)

export const updateRecipe = (id: number | string, payload: EditRecipeRequest) =>
  apiPatch<Recipe>(`/recipes/${id}`, payload)

export const updateRecipeImage = (id: number | string, imageUrl: string | null) =>
  apiPatch<Recipe>(`/recipes/${id}`, { imageUrl })

export const searchRecipes = async (name: string): Promise<RecipeSearchResult[]> => {
  const res = await fetch(`/api/search/recipes?name=${encodeURIComponent(name)}`)
  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }
  return res.json()
}

export const searchCuisines = (query: string) =>
  apiFetch<Cuisine[]>(`/cuisines?query=${encodeURIComponent(query)}`)

export const searchIngredients = (query: string) =>
  apiFetch<Ingredient[]>(`/ingredients?query=${encodeURIComponent(query)}`)

export const searchTags = (query: string) =>
  apiFetch<Tag[]>(`/tags?query=${encodeURIComponent(query)}`)

export const listUnits = () => apiFetch<Unit[]>("/units", 3600)

export const presignRecipeImageUpload = (contentType: string, contentLength: number) =>
  apiPost<PresignedImageUpload>("/recipes/images/presign", { contentType, contentLength })

// R2 image keys look like "recipes/<uuid>.jpg"; recipe.imageUrl may be that bare key or a full
// URL (recipe-api resolves stored keys to a full URL on read). Accept either: an already-bare
// key round-trips unchanged since it isn't a parseable URL.
function toImageKey(imageUrlOrKey: string): string {
  try {
    return new URL(imageUrlOrKey).pathname.replace(/^\//, "")
  } catch {
    return imageUrlOrKey
  }
}

export const deleteRecipeImage = async (imageUrlOrKey: string): Promise<void> => {
  const key = toImageKey(imageUrlOrKey)
  const res = await fetch(`${process.env.API_URL}/recipes/images?key=${encodeURIComponent(key)}`, {
    method: "DELETE",
    headers: { "x-api-key": process.env.API_KEY ?? "" },
  })

  if (!res.ok) {
    const err = new Error(`API ${res.status}`)
    ;(err as NodeJS.ErrnoException).code = String(res.status)
    throw err
  }
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

  const res = await fetch(`${process.env.API_URL}/recipes?${qs}`, {
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
