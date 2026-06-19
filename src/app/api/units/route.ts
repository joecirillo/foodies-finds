import { listUnits } from "@/lib/api"

export async function GET() {
  try {
    return Response.json(await listUnits())
  } catch {
    return Response.json([], { status: 500 })
  }
}
