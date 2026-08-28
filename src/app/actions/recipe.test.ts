import { describe, it, expect, vi, beforeEach } from "vitest"
import type { SaveRecipeRequest, EditRecipeRequest, PresignedImageUpload, Recipe } from "@/types/recipe"

vi.mock("@/lib/api", () => ({
  addRecipe: vi.fn(),
  updateRecipe: vi.fn(),
  updateRecipeImage: vi.fn(),
  presignRecipeImageUpload: vi.fn(),
  deleteRecipeImage: vi.fn(),
}))

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}))

import {
  addRecipe,
  updateRecipe,
  updateRecipeImage,
  presignRecipeImageUpload,
  deleteRecipeImage,
} from "@/lib/api"
import { revalidatePath } from "next/cache"
import {
  addRecipeAction,
  updateRecipeAction,
  presignRecipeImageUploadAction,
  attachRecipeImageAction,
  deleteRecipeImageAction,
} from "./recipe"

const mockAddRecipe = vi.mocked(addRecipe)
const mockUpdateRecipe = vi.mocked(updateRecipe)
const mockUpdateRecipeImage = vi.mocked(updateRecipeImage)
const mockPresignRecipeImageUpload = vi.mocked(presignRecipeImageUpload)
const mockDeleteRecipeImage = vi.mocked(deleteRecipeImage)
const mockRevalidatePath = vi.mocked(revalidatePath)

beforeEach(() => {
  mockAddRecipe.mockReset()
  mockUpdateRecipe.mockReset()
  mockUpdateRecipeImage.mockReset()
  mockPresignRecipeImageUpload.mockReset()
  mockDeleteRecipeImage.mockReset()
  mockRevalidatePath.mockReset()
})

describe("addRecipeAction", () => {
  it("returns { ok: true, id } on success", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 5 } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({ ok: true, id: 5 })
  })

  it("returns error when response has no id (null)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: null } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns error when response has no id (0)", async () => {
    mockAddRecipe.mockResolvedValueOnce({ id: 0 } as Recipe)

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was saved but no ID was returned",
    })
  })

  it("returns a generic error when addRecipe throws a 500 API error", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockAddRecipe.mockRejectedValueOnce(err)

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong on our end. Please try again.",
    })
  })

  it("returns the API error message when addRecipe throws a non-500 error", async () => {
    const err = Object.assign(new Error("API 400"), { code: "400" })
    mockAddRecipe.mockRejectedValueOnce(err)

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({ ok: false, error: "API 400" })
  })

  it("returns fallback error when thrown value is not an Error instance", async () => {
    mockAddRecipe.mockRejectedValueOnce("something went wrong")

    const result = await addRecipeAction({ name: "Pizza" } as SaveRecipeRequest)
    expect(result).toEqual({ ok: false, error: "Failed to save recipe" })
  })
})

describe("updateRecipeAction", () => {
  it("returns { ok: true, id } on success", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 7 } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({ ok: true, id: 7 })
  })

  it("calls revalidatePath with the recipe path on success", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 7 } as Recipe)

    await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(mockRevalidatePath).toHaveBeenCalledWith("/recipe/7")
  })

  it("calls updateRecipe with the given id and payload", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 3 } as Recipe)
    const payload = { name: "Pasta" } as EditRecipeRequest

    await updateRecipeAction(3, payload)
    expect(mockUpdateRecipe).toHaveBeenCalledWith(3, payload)
  })

  it("returns error when response has no id (null)", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: null } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was updated but no ID was returned",
    })
  })

  it("returns error when response has no id (0)", async () => {
    mockUpdateRecipe.mockResolvedValueOnce({ id: 0 } as Recipe)

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Recipe was updated but no ID was returned",
    })
  })

  it("returns a generic error when updateRecipe throws a 500 API error", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({
      ok: false,
      error: "Something went wrong on our end. Please try again.",
    })
  })

  it("returns the API error message when updateRecipe throws a non-500 error", async () => {
    const err = Object.assign(new Error("API 503"), { code: "503" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({ ok: false, error: "API 503" })
  })

  it("returns fallback error when thrown value is not an Error instance", async () => {
    mockUpdateRecipe.mockRejectedValueOnce("oops")

    const result = await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(result).toEqual({ ok: false, error: "Failed to update recipe" })
  })

  it("does not call revalidatePath when update fails", async () => {
    const err = Object.assign(new Error("API 500"), { code: "500" })
    mockUpdateRecipe.mockRejectedValueOnce(err)

    await updateRecipeAction(7, { name: "Pizza" } as EditRecipeRequest)
    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})

describe("presignRecipeImageUploadAction", () => {
  it("returns { ok: true, ...presigned } on success", async () => {
    const presigned: PresignedImageUpload = {
      uploadUrl: "https://account.r2.cloudflarestorage.com/signed",
      key: "recipes/abc-123.jpg",
      imageUrl: "https://cdn.foodiesfinds.com/recipes/abc-123.jpg",
    }
    mockPresignRecipeImageUpload.mockResolvedValueOnce(presigned)

    const result = await presignRecipeImageUploadAction("image/jpeg", 1024)
    expect(result).toEqual({ ok: true, ...presigned })
  })

  it("rejects an unsupported content type before calling the API", async () => {
    const result = await presignRecipeImageUploadAction("application/pdf", 1024)
    expect(result).toEqual({
      ok: false,
      error: "File must be jpeg, png, webp, or gif. HEIC photos aren't supported — please choose a different format.",
    })
    expect(mockPresignRecipeImageUpload).not.toHaveBeenCalled()
  })

  it("rejects image/heic since browsers other than Safari can't render it", async () => {
    const result = await presignRecipeImageUploadAction("image/heic", 1024)
    expect(result).toEqual({
      ok: false,
      error: "File must be jpeg, png, webp, or gif. HEIC photos aren't supported — please choose a different format.",
    })
    expect(mockPresignRecipeImageUpload).not.toHaveBeenCalled()
  })

  it("returns the API error message when presigning fails", async () => {
    const err = Object.assign(new Error("API 400"), { code: "400" })
    mockPresignRecipeImageUpload.mockRejectedValueOnce(err)

    const result = await presignRecipeImageUploadAction("image/jpeg", 1024)
    expect(result).toEqual({ ok: false, error: "API 400" })
  })
})

describe("attachRecipeImageAction", () => {
  it("returns { ok: true } and calls updateRecipeImage with the id and key", async () => {
    mockUpdateRecipeImage.mockResolvedValueOnce({ id: 7 } as Recipe)

    const result = await attachRecipeImageAction(7, "recipes/abc-123.jpg")
    expect(result).toEqual({ ok: true })
    expect(mockUpdateRecipeImage).toHaveBeenCalledWith(7, "recipes/abc-123.jpg")
  })

  it("returns { ok: false } without throwing when updateRecipeImage fails", async () => {
    mockUpdateRecipeImage.mockRejectedValueOnce(new Error("API 500"))

    const result = await attachRecipeImageAction(7, "recipes/abc-123.jpg")
    expect(result).toEqual({ ok: false })
  })
})

describe("deleteRecipeImageAction", () => {
  it("calls deleteRecipeImage with the given value", async () => {
    mockDeleteRecipeImage.mockResolvedValueOnce(undefined)

    await deleteRecipeImageAction("recipes/abc-123.jpg")
    expect(mockDeleteRecipeImage).toHaveBeenCalledWith("recipes/abc-123.jpg")
  })

  it("does not throw when deleteRecipeImage fails", async () => {
    mockDeleteRecipeImage.mockRejectedValueOnce(new Error("API 500"))

    await expect(deleteRecipeImageAction("recipes/abc-123.jpg")).resolves.toBeUndefined()
  })
})
