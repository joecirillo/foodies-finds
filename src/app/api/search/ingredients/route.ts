import type { ApiResponse, Ingredient } from "@/types/recipe"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? ""

  const res = await fetch(
    `${process.env.API_URL}/ingredient/search?query=${encodeURIComponent(query)}`,
    { headers: { "x-api-key": process.env.API_KEY ?? "" } }
  )

  if (!res.ok) {
    return Response.json([], { status: res.status })
  }

  const body: ApiResponse<Ingredient[]> = await res.json()
  return Response.json(body.data)
}
