import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/api")>()),
  listRecipes: vi.fn(),
}))

import { GET } from "./route"
import { listRecipes, type ApiError } from "@/lib/api"

const mockListRecipes = vi.mocked(listRecipes)

const requestWith = (query: string) => new Request(`http://localhost/api/recipes${query}`)

const apiError = (code: string, message: string) =>
  Object.assign(new Error(message), { code }) as ApiError

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/recipes", () => {
  it("returns the page of recipes older than the cursor", async () => {
    const page = { recipes: [{ id: 3, name: "Soup" }], nextCursor: 3 }
    mockListRecipes.mockResolvedValueOnce(page)

    const res = await GET(requestWith("?cursor=4"))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(page)
    expect(mockListRecipes).toHaveBeenCalledWith(4)
  })

  it.each(["", "?cursor=", "?cursor=abc", "?cursor=0", "?cursor=-2", "?cursor=1.5"])(
    "rejects an invalid cursor (%s) without calling the API",
    async (query) => {
      const res = await GET(requestWith(query))

      expect(res.status).toBe(400)
      expect(mockListRecipes).not.toHaveBeenCalled()
    },
  )

  it("passes through a client error message from the API", async () => {
    mockListRecipes.mockRejectedValueOnce(apiError("400", "Invalid cursor"))

    const res = await GET(requestWith("?cursor=4"))

    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ message: "Invalid cursor" })
  })

  it("hides server failures behind a friendly 502", async () => {
    mockListRecipes.mockRejectedValueOnce(apiError("500", "Database connection failed"))

    const res = await GET(requestWith("?cursor=4"))

    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({
      message: "Couldn't load more recipes. Please try again.",
    })
  })
})
