import type { ApiResponse, Recipe } from "@/types/recipe"

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

export const getRecipe = (id: number | string) =>
  apiFetch<Recipe>(`/recipe/get/${id}`)
