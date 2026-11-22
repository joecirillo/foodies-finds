import { describe, it, expect, vi, beforeEach } from "vitest"
import type { EditRecipeRequest, SaveRecipeRequest } from "@/types/recipe"
import {
  addRecipe,
  getRecipe,
  getRandomRecipe,
  updateRecipe,
  presignRecipeImageUpload,
  deleteRecipeImage,
  listRecipes,
  loadMoreRecipes,
  searchRecipes,
  filterRecipes,
  importRecipeFromUrl,
} from "./api"

const mockFetch = vi.fn()
vi.stubGlobal("fetch", mockFetch)

beforeEach(() => {
  mockFetch.mockReset()
})

describe("addRecipe", () => {
  it("returns parsed response body on success", async () => {
    const recipe = { id: 42, name: "Pasta" }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: recipe }),
    })

    const result = await addRecipe({ name: "Pasta" } as SaveRecipeRequest)
    expect(result).toEqual(recipe)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Ingredient not found" }),
    })

    await expect(addRecipe({ name: "Bad" } as SaveRecipeRequest)).rejects.toMatchObject({
      message: "Ingredient not found",
      code: "400",
    })
  })

  it("throws Error with status code when the body has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    })

    await expect(addRecipe({ name: "Bad" } as SaveRecipeRequest)).rejects.toMatchObject({
      message: "API 400",
      code: "400",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(addRecipe({ name: "Bad" } as SaveRecipeRequest)).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })

  it("propagates network failures", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    await expect(addRecipe({ name: "Bad" } as SaveRecipeRequest)).rejects.toThrow("Network error")
  })
})

describe("updateRecipe", () => {
  it("returns parsed response body on success", async () => {
    const recipe = { id: 42, name: "Pasta" }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: recipe }),
    })

    const result = await updateRecipe(42, { name: "Pasta" } as EditRecipeRequest)
    expect(result).toEqual(recipe)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Ingredient not found" }),
    })

    await expect(updateRecipe(42, { name: "Bad" } as EditRecipeRequest)).rejects.toMatchObject({
      message: "Ingredient not found",
      code: "400",
    })
  })

  it("throws Error with status code when the body has no message", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({}),
    })

    await expect(updateRecipe(42, { name: "Bad" } as EditRecipeRequest)).rejects.toMatchObject({
      message: "API 400",
      code: "400",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(updateRecipe(42, { name: "Bad" } as EditRecipeRequest)).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })

  it("propagates network failures", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    await expect(updateRecipe(42, { name: "Bad" } as EditRecipeRequest)).rejects.toThrow(
      "Network error",
    )
  })
})

describe("listRecipes", () => {
  const recipes = [
    { id: 2, name: "Tacos" },
    { id: 1, name: "Pasta" },
  ]

  it("reads the recipes from data and the next cursor from meta.pagination", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({
          data: recipes,
          meta: { pagination: { nextCursor: "eyJpZCI6MX0", limit: 12 } },
        }),
    })

    const result = await listRecipes()
    expect(result).toEqual({ recipes, nextCursor: "eyJpZCI6MX0" })
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/recipes$/)
  })

  it("treats a response without pagination as the last page", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: recipes }) })

    const result = await listRecipes()
    expect(result).toEqual({ recipes, nextCursor: null })
  })

  it("sends the cursor URL-encoded", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: [] }) })

    await listRecipes("a+b/c")
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/recipes\?cursor=a%2Bb%2Fc$/)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Database connection failed" }),
    })

    await expect(listRecipes()).rejects.toMatchObject({
      message: "Database connection failed",
      code: "500",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(listRecipes()).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })
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

describe("getRecipe", () => {
  it("unwraps body.data on success", async () => {
    const recipe = { id: 7, name: "Tacos" }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: recipe }),
    })

    const result = await getRecipe(7)
    expect(result).toEqual(recipe)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "Recipe not found with id: 99" }),
    })

    await expect(getRecipe(99)).rejects.toMatchObject({
      message: "Recipe not found with id: 99",
      code: "404",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(getRecipe(99)).rejects.toMatchObject({
      message: "API 404",
      code: "404",
    })
  })
})

describe("getRandomRecipe", () => {
  it("unwraps body.data from the backend random endpoint", async () => {
    const recipe = { id: 7, name: "Tacos" }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: recipe }),
    })

    const result = await getRandomRecipe()
    expect(result).toEqual(recipe)
    expect(mockFetch.mock.calls[0][0]).toMatch(/\/recipes\/random$/)
  })

  it("caches for 60 seconds by default, like other reads", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {} }) })

    await getRandomRecipe()
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ next: { revalidate: 60 } })
  })

  it("lets callers opt out of caching", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ data: {} }) })

    await getRandomRecipe({ revalidate: 0 })
    expect(mockFetch.mock.calls[0][1]).toMatchObject({ next: { revalidate: 0 } })
  })

  it("returns null when there are no recipes", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: () => Promise.resolve({ message: "No recipes found" }),
    })

    await expect(getRandomRecipe()).resolves.toBeNull()
  })

  it("throws with the API error message on other failures", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ message: "Internal server error" }),
    })

    await expect(getRandomRecipe()).rejects.toMatchObject({
      message: "Internal server error",
      code: "500",
    })
  })
})

describe("presignRecipeImageUpload", () => {
  it("returns the presigned upload payload on success", async () => {
    const presigned = {
      uploadUrl: "https://account.r2.cloudflarestorage.com/signed",
      key: "recipes/abc-123.jpg",
      imageUrl: "https://cdn.foodiesfinds.com/recipes/abc-123.jpg",
    }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: presigned }),
    })

    const result = await presignRecipeImageUpload("image/jpeg", 1024)
    expect(result).toEqual(presigned)
  })

  it("throws with the API error message on a non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Unsupported file type" }),
    })

    await expect(presignRecipeImageUpload("application/pdf", 1024)).rejects.toMatchObject({
      message: "Unsupported file type",
      code: "400",
    })
  })
})

describe("deleteRecipeImage", () => {
  it("sends the key as a query param when given a bare key", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await deleteRecipeImage("recipes/abc-123.jpg")

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/recipes/images?key=recipes%2Fabc-123.jpg"),
      expect.objectContaining({ method: "DELETE" }),
    )
  })

  it("derives the key from a full imageUrl before sending", async () => {
    mockFetch.mockResolvedValueOnce({ ok: true })

    await deleteRecipeImage("https://cdn.foodiesfinds.com/recipes/abc-123.jpg")

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining("/recipes/images?key=recipes%2Fabc-123.jpg"),
      expect.objectContaining({ method: "DELETE" }),
    )
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid image key" }),
    })

    await expect(deleteRecipeImage("recipes/abc-123.jpg")).rejects.toMatchObject({
      message: "Invalid image key",
      code: "400",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(deleteRecipeImage("recipes/abc-123.jpg")).rejects.toMatchObject({
      message: "API 400",
      code: "400",
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

describe("filterRecipes", () => {
  it("unwraps body.data on success", async () => {
    const list = [{ id: 1, name: "Pasta" }]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: list }),
    })

    const result = await filterRecipes({ name: "pasta" })
    expect(result).toEqual(list)
  })

  it("throws with the API error message when the body has a message field", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () => Promise.resolve({ message: "Invalid cuisineId" }),
    })

    await expect(filterRecipes({ cuisineId: -1 })).rejects.toMatchObject({
      message: "Invalid cuisineId",
      code: "400",
    })
  })

  it("throws Error with status code when the body cannot be parsed", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.reject(new Error("not json")),
    })

    await expect(filterRecipes({ name: "pasta" })).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })
})

describe("importRecipeFromUrl", () => {
  it("posts the url to the import preview endpoint and returns the preview", async () => {
    const preview = { recipe: { name: "Soup" }, source: {}, warnings: [] }
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: preview }),
    })

    const result = await importRecipeFromUrl("https://www.seriouseats.com/soup")

    expect(result).toEqual(preview)
    const [url, init] = mockFetch.mock.calls[0]
    expect(url).toMatch(/\/recipes\/import-preview$/)
    expect(init.method).toBe("POST")
    expect(JSON.parse(init.body)).toEqual({ url: "https://www.seriouseats.com/soup" })
  })

  it("keeps the backend error code alongside the HTTP status", async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      json: () =>
        Promise.resolve({
          message: "No recipe data was found on that page.",
          code: "NO_RECIPE_FOUND",
        }),
    })

    await expect(importRecipeFromUrl("https://example.com")).rejects.toMatchObject({
      message: "No recipe data was found on that page.",
      code: "400",
      errorCode: "NO_RECIPE_FOUND",
    })
  })
})
