import { searchIngredients } from "@/lib/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? ""
  try {
    return Response.json(await searchIngredients(query))
  } catch {
    return Response.json([], { status: 500 })
  }
}
