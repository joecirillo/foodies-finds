import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api", () => ({
  listRecipes: vi.fn(),
  getRecipe: vi.fn(),
}))

vi.mock("@/lib/utils/random", () => ({
  pickRandom: vi.fn(),
}))

import { GET } from "./route"
import { listRecipes, getRecipe } from "@/lib/api"
import { pickRandom } from "@/lib/utils/random"

const mockListRecipes = vi.mocked(listRecipes)
const mockGetRecipe = vi.mocked(getRecipe)
const mockPickRandom = vi.mocked(pickRandom)

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
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("GET /api/recipes/random", () => {
  it("returns a random recipe as JSON", async () => {
    mockListRecipes.mockResolvedValueOnce([{ id: 5, name: "Steak" }])
    mockPickRandom.mockReturnValueOnce({ id: 5, name: "Steak" })
    mockGetRecipe.mockResolvedValueOnce(recipe)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(200)
    expect(body).toEqual(recipe)
    expect(mockGetRecipe).toHaveBeenCalledWith(5)
  })

  it("returns 404 when list is empty", async () => {
    mockListRecipes.mockResolvedValueOnce([])
    mockPickRandom.mockReturnValueOnce(undefined)

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(404)
    expect(body).toMatchObject({ error: "No recipes found" })
  })

  it("returns 500 when listRecipes throws", async () => {
    mockListRecipes.mockRejectedValueOnce(new Error("Network error"))

    const res = await GET()
    const body = await res.json()

    expect(res.status).toBe(500)
    expect(body).toMatchObject({ error: "Failed to fetch recipe" })
  })

  it("returns 500 when getRecipe throws", async () => {
    mockListRecipes.mockResolvedValueOnce([{ id: 5, name: "Steak" }])
    mockPickRandom.mockReturnValueOnce({ id: 5, name: "Steak" })
    mockGetRecipe.mockRejectedValueOnce(new Error("Not found"))

    const res = await GET()

    expect(res.status).toBe(500)
  })
})
