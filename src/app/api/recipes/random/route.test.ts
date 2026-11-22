import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"

vi.mock("@/lib/api", () => ({
  getRandomRecipe: vi.fn(),
}))

import { GET } from "./route"
import { getRandomRecipe } from "@/lib/api"

const mockGetRandomRecipe = vi.mocked(getRandomRecipe)

const recipe = {
  id: 5,
  name: "Steak",
  description: null,
  calories: null,
  servings: 2,
  cookingTime: 20,
  preparationTime: 10,
  cuisine: null,
  tags: [],
  author: null,
  ingredients: [],
  steps: [],
  imageUrl: null,
  sourceUrl: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.spyOn(console, "error").mockImplementation(() => {})
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe("GET /api/recipes/random", () => {
  it("returns a random recipe from the whole collection as JSON", async () => {
    mockGetRandomRecipe.mockResolvedValueOnce(recipe)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(recipe)
  })

  it("skips the fetch cache so Try Another gets a fresh pick", async () => {
    mockGetRandomRecipe.mockResolvedValueOnce(recipe)

    await GET()

    expect(mockGetRandomRecipe).toHaveBeenCalledWith({ revalidate: 0 })
  })

  it("returns 404 when there are no recipes", async () => {
    mockGetRandomRecipe.mockResolvedValueOnce(null)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toMatchObject({ error: "No recipes found" })
  })

  it("returns 500 without leaking the error when the backend call fails", async () => {
    const error = new Error("Network error")
    mockGetRandomRecipe.mockRejectedValueOnce(error)

    const res = await GET()
    const body = await res.json()

    expect(console.error).toHaveBeenCalledWith("Failed to fetch random recipe:", error)

    expect(res.status).toBe(500)
    expect(body).toEqual({ error: "Failed to fetch recipe" })
  })
})
