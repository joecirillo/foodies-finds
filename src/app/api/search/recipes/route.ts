import { filterRecipes } from "@/lib/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get("name") ?? ""
  try {
    return Response.json(await filterRecipes({ name }))
  } catch {
    return Response.json([], { status: 500 })
  }
}
