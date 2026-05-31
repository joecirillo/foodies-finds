import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AddRecipePayload } from "@/types/recipe"
import { addRecipe, getRecipe } from "./api"

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
      json: () => Promise.resolve(recipe),
    })

    const result = await addRecipe({ name: "Pasta" } as AddRecipePayload)
    expect(result).toEqual(recipe)
  })

  it("throws Error with status code on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 400 })

    await expect(addRecipe({ name: "Bad" } as AddRecipePayload)).rejects.toMatchObject({
      message: "API 400",
      code: "400",
    })
  })

  it("throws Error with status code on 500 response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

    await expect(addRecipe({ name: "Bad" } as AddRecipePayload)).rejects.toMatchObject({
      message: "API 500",
      code: "500",
    })
  })

  it("propagates network failures", async () => {
    mockFetch.mockRejectedValueOnce(new Error("Network error"))

    await expect(addRecipe({ name: "Bad" } as AddRecipePayload)).rejects.toThrow("Network error")
  })
})

describe("listRecipes", () => {
  it("unwraps body.data on success", async () => {
    const { listRecipes } = await import("./api")
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

  it("throws Error with status code on non-ok response", async () => {
    const { listRecipes } = await import("./api")
    mockFetch.mockResolvedValueOnce({ ok: false, status: 500 })

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

  it("throws Error with correct status code on non-ok response", async () => {
    mockFetch.mockResolvedValueOnce({ ok: false, status: 404 })

    await expect(getRecipe(99)).rejects.toMatchObject({
      message: "API 404",
      code: "404",
    })
  })
})
