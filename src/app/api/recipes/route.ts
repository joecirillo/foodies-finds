import { isApiError, listRecipes } from "@/lib/api"

const LOAD_FAILED_MESSAGE = "Couldn't load more recipes. Please try again."
// Only errors the browser's own request can cause are worth showing; an upstream
// 401/403 means our server-side API key is wrong, which the user can't act on.
const REQUEST_ERROR_CODES = new Set(["400", "404"])

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
    const isRequestError = isApiError(error) && REQUEST_ERROR_CODES.has(error.code)
    return isRequestError
      ? Response.json({ message: error.message }, { status: Number(error.code) })
      : Response.json({ message: LOAD_FAILED_MESSAGE }, { status: 502 })
  }
}
