import { describe, it, expect, vi, beforeEach } from "vitest"
import type { AddRecipePayload, Recipe } from "@/types/recipe"

vi.mock("@/lib/api", () => ({
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import { addRecipe, updateRecipe } from "@/lib/api"
import { revalidatePath } from "next/cache"
import { addRecipeAction, updateRecipeAction } from "./recipe"

const mockAddRecipe = vi.mocked(addRecipe)
const mockUpdateRecipe = vi.mocked(updateRecipe)
const mockRevalidatePath = vi.mocked(revalidatePath)

beforeEach(() => {
  mockAddRecipe.mockReset()
  mockUpdateRecipe.mockReset()
  mockRevalidatePath.mockReset()
})

describe("addRecipeAction", () => {
  it("returns { ok: true, id } on success", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 5 } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: true, id: 5 })
  })

  it("returns error when response has no id (null)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: null } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns error when response has no id (0)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 0 } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns a generic error when addRecipe throws a 500 API error", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockAddRecipe.mockRejectedValueOnce(err)

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong on our end. Please try again.",
    })
  })

  it("returns the API error message when addRecipe throws a non-500 error", async () => {
    const err = Object.assign(new Error("API 400"), { code: "400" })
    mockAddRecipe.mockRejectedValueOnce(err)

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: false, error: "API 400" })
  })

  it("returns fallback error when thrown value is not an Error instance", async () => {
    mockAddRecipe.mockRejectedValueOnce("something went wrong")

    const result = await addRecipeAction({ name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: false, error: "Failed to save recipe" })
  })
})

describe("updateRecipeAction", () => {
  it("returns { ok: true, id } on success", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 7 } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: true, id: 7 })
  })

  it("calls revalidatePath with the recipe path on success", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 7 } as Recipe)

    await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipe/7")
  })

  it("calls updateRecipe with the given id and payload", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 3 } as Recipe)
    const payload = { name: "Pasta" } as AddRecipePayload

    await updateRecipeAction(3, payload)
    expect(mockUpdateRecipe).toHaveBeenCalledWith(3, payload)
  })

  it("returns error when response has no id (null)", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: null } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was updated but no ID was returned",
    })
  })

  it("returns error when response has no id (0)", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 0 } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was updated but no ID was returned",
    })
  })

  it("returns a generic error when updateRecipe throws a 500 API error", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong on our end. Please try again.",
    })
  })

  it("returns the API error message when updateRecipe throws a non-500 error", async () => {
    const err = Object.assign(new Error("API 503"), { code: "503" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: false, error: "API 503" })
  })

  it("returns fallback error when thrown value is not an Error instance", async () => {
    mockUpdateRecipe.mockRejectedValueOnce("oops")

    const result = await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(result).toEqual({ ok: false, error: "Failed to update recipe" })
  })

  it("does not call revalidatePath when update fails", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    await updateRecipeAction(7, { name: "Pizza" } as AddRecipePayload)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
