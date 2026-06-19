import { searchTags } from "@/lib/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const query = searchParams.get("query") ?? ""
  try {
    return Response.json(await searchTags(query))
  } catch {
    return Response.json([], { status: 500 })
  }
}
