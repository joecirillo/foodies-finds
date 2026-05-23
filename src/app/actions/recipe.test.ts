import { describe, it, expect, vi, beforeEach } from "vitest"

vi.mock("@/lib/api", () => ({
  addRecipe: vi.fn(),
}))

import { addRecipe } from "@/lib/api"
import { addRecipeAction } from "./recipe"

const mockAddRecipe = vi.mocked(addRecipe)

beforeEach(() => {
  mockAddRecipe.mockReset()
})

describe("addRecipeAction", () => {
  it("returns { ok: true, id } on success", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 5 } as never)

    const result = await addRecipeAction({ name: "Pizza" } as never)
    expect(result).toEqual({ ok: true, id: 5 })
  })

  it("returns error when response has no id (null)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: null } as never)

    const result = await addRecipeAction({ name: "Pizza" } as never)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns error when response has no id (0)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 0 } as never)

    const result = await addRecipeAction({ name: "Pizza" } as never)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns error message when addRecipe throws an Error", async () => {
    mockAddRecipe.mockRejectedValueOnce(new Error("API 500"))

    const result = await addRecipeAction({ name: "Pizza" } as never)
    expect(result).toEqual({ ok: false, error: "API 500" })
  })

  it("returns fallback error when thrown value is not an Error instance", async () => {
    mockAddRecipe.mockRejectedValueOnce("something went wrong")

    const result = await addRecipeAction({ name: "Pizza" } as never)
    expect(result).toEqual({ ok: false, error: "Failed to save recipe" })
  })
})
