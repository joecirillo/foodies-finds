import { describe, it, expect, vi, beforeEach } from "vitest"
import { loadMoreRecipes, searchRecipes } from "./api-client"
const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe("loadMoreRecipes", () => {
  it("fetches the next page from the local route handler", async () => {
    const page = { recipes: [{ id: 3, name: "Soup" }], nextCursor: "eyJpZCI6M30" }
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve(page) })

    const result = await loadMoreRecipes("eyJpZCI6NH0")
    expect(result).toEqual(page)
    expect(mockFetch).toHaveBeenCalledWith("/api/recipes?cursor=eyJpZCI6NH0")
  })

  it("throws with the route's error message on failure", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 502,
      json: () => Promise.resolve({ message: "Couldn't load more recipes" }),
    })

    await expect(loadMoreRecipes("eyJpZCI6NH0")).rejects.toMatchObject({
      message: "Couldn't load more recipes",
      code: "502",
    })
  })
})

describe("searchRecipes", () => {
  it("returns the parsed array on success", async () => {
    const list = [{ id: 1, name: "Pasta" }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(list),
    })

    const result = await searchRecipes("pasta")
    expect(result).toEqual(list)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Search failed" }),
    })

    await expect(searchRecipes("pasta")).rejects.toMatchObject({
      message: "Search failed",
      code: "500",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(searchRecipes("pasta")).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })
})
