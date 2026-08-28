import { describe, it, expect, vi, beforeEach } from "vitest"
import type { EditRecipeRequest, SaveRecipeRequest } from "@/types/recipe"
import {
  addRecipe,
  getRecipe,
  updateRecipe,
  presignRecipeImageUpload,
  deleteRecipeImage,
  listRecipes,
  searchRecipes,
  filterRecipes,
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
  it("unwraps body.data on success", async () => {
    const list = [
      { id: 1, name: "Pasta" },
      { id: 2, name: "Tacos" },
    ]
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ data: list }),
    })

    const result = await listRecipes()
    expect(result).toEqual(list)
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
