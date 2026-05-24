import type { ApiResponse, Unit } from "@/types/recipe"

export async function GET() {
  const res = await fetch(`${process.env.API_URL}/unit/list`, {
    headers: { "x-api-key": process.env.API_KEY ?? "" },
    next: { revalidate: 3600 },
  })

  if (!res.ok) {
    return Response.json([], { status: res.status })
  }

  const body: ApiResponse<Unit[]> = await res.json()
  return Response.json(body.data)
}
