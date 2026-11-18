import { isApiError, listRecipes } from "@/lib/api"

const LOAD_FAILED_MESSAGE = "Couldn't load more recipes. Please try again."

const parseCursor = (raw: string | null) => {
  const cursor = Number(raw)
  return raw !== null && Number.isInteger(cursor) && cursor > 0 ? cursor : null
}

export async function GET(request: Request) {
  const cursor = parseCursor(new URL(request.url).searchParams.get("cursor"))
  if (cursor === null) {
    return Response.json({ message: "A positive integer cursor is required." }, { status: 400 })
  }

  try {
    return Response.json(await listRecipes(cursor))
  } catch (error) {
    const isClientError = isApiError(error) && error.code.startsWith("4")
    return isClientError
      ? Response.json({ message: error.message }, { status: Number(error.code) })
      : Response.json({ message: LOAD_FAILED_MESSAGE }, { status: 502 })
  }
}
