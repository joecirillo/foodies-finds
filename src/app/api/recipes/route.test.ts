import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api", () => ({
  listRecipes: vi.fn(),
}))

import { GET } from "./route"
import { listRecipes } from "@/lib/api"
import type { ApiError } from "@/lib/api-error"

const mockListRecipes = vi.mocked(listRecipes)

const requestWith = (query: string) => new Request(`http://localhost/api/recipes${query}`)

const apiError = (code: string, message: string) =>
  Object.assign(new Error(message), { code }) as ApiError

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/recipes", () => {
  it("passes the opaque cursor through and returns the next page", async () => {
    const page = { recipes: [{ id: 3, name: "Soup" }], nextCursor: "eyJpZCI6M30" }
    mockListRecipes.mockResolvedValueOnce(page)

    const res = await GET(requestWith("?cursor=eyJpZCI6NH0"))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(page)
    expect(mockListRecipes).toHaveBeenCalledWith("eyJpZCI6NH0")
  })

  it.each(["", "?cursor="])(
    "rejects a missing cursor (%s) without calling the API",
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

  it.each([
    ["500", "Database connection failed"],
    ["401", "Unauthorized"],
    ["403", "Forbidden"],
    ["429", "Rate limit exceeded"],
  ])("hides an upstream %s behind a friendly 502", async (code, message) => {
    mockListRecipes.mockRejectedValueOnce(apiError(code, message))

    const res = await GET(requestWith("?cursor=4"))

    expect(res.status).toBe(502)
    expect(await res.json()).toEqual({
      message: "Couldn't load more recipes. Please try again.",
    })
  })

  it("hides unexpected non-API errors behind a friendly 502", async () => {
    mockListRecipes.mockRejectedValueOnce(new TypeError("fetch failed"))

    const res = await GET(requestWith("?cursor=4"))

    expect(res.status).toBe(502)
  })
})
