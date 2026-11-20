import { isApiError, listRecipes } from "@/lib/api"

const LOAD_FAILED_MESSAGE = "Couldn't load more recipes. Please try again."
const USER_FIXABLE_ERROR_CODES = new Set(["400", "404"])

export async function GET(request: Request) {
  const cursor = new URL(request.url).searchParams.get("cursor")
  if (!cursor) {
    return Response.json({ message: "A cursor is required." }, { status: 400 })
  }

  try {
    return Response.json(await listRecipes(cursor))
  } catch (error) {
    const isUserFixable = isApiError(error) && USER_FIXABLE_ERROR_CODES.has(error.code)
    return isUserFixable
      ? Response.json({ message: error.message }, { status: Number(error.code) })
      : Response.json({ message: LOAD_FAILED_MESSAGE }, { status: 502 })
  }
}
