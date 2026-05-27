import type { ApiResponse, RecipeSearchResult } from "@/types/recipe"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name") ?? ""

  const res = await fetch(
    `${process.env.API_URL}/recipe/search?name=${encodeURIComponent(name)}`,
    { headers: { "x-api-key": process.env.API_KEY ?? "" } }
  )

  if (!res.ok) {
    return Response.json([], { status: res.status })
  }

  const body: ApiResponse<RecipeSearchResult[]> = await res.json()
  return Response.json(body.data)
}
