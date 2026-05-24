import type { ApiResponse, Cuisine } from "@/types/recipe"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? ""

  const res = await fetch(
    `${process.env.API_URL}/cuisine/search?query=${encodeURIComponent(query)}`,
    { headers: { "x-api-key": process.env.API_KEY ?? "" } }
  )

  if (!res.ok) {
    return Response.json([], { status: res.status })
  }

  const body: ApiResponse<Cuisine[]> = await res.json()
  return Response.json(body.data)
}
