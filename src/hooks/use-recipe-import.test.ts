// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { RecipeImportPreview } from "@/types/recipe"
import type { ImportRecipeResult } from "@/app/actions/recipe"

vi.mock("@/app/actions/recipe", () => ({
  importRecipeFromUrlAction: vi.fn(),
}))

import { importRecipeFromUrlAction } from "@/app/actions/recipe"
import { useRecipeImport } from "./use-recipe-import"

const mockImport = vi.mocked(importRecipeFromUrlAction)

const previewNamed = (name: string): RecipeImportPreview => ({
  recipe: { name },
  source: {
    sourceUrl: `https://example.com/${name}`,
    originalAuthor: null,
    originalIngredientLines: [],
    originalYield: null,
    recipeCount: 1,
  },
  warnings: [],
})

const deferred = () => {
  let resolve!: (value: ImportRecipeResult) => void
  const promise = new Promise<ImportRecipeResult>((r) => (resolve = r))
  return { promise, resolve }
}

beforeEach(() => {
  mockImport.mockReset()
})

describe("useRecipeImport", () => {
  it("reports loading and hands a successful preview to the caller", async () => {
    const request = deferred()
    mockImport.mockReturnValueOnce(request.promise)
    const onPreview = vi.fn()
    const { result } = renderHook(() => useRecipeImport({ onPreview }))

    let pending!: Promise<void>
    act(() => {
      pending = result.current.importFromUrl("https://example.com/soup")
    })
    expect(result.current.status).toBe("loading")

    await act(async () => {
      request.resolve({ ok: true, preview: previewNamed("soup") })
      await pending
    })

    expect(result.current.status).toBe("idle")
    expect(result.current.error).toBeNull()
    expect(onPreview).toHaveBeenCalledWith(previewNamed("soup"))
  })

  it("surfaces the action's error without calling onPreview", async () => {
    mockImport.mockResolvedValueOnce({
      ok: false,
      error: "No recipe data was found on that page.",
      code: "NO_RECIPE_FOUND",
    })
    const onPreview = vi.fn()
    const { result } = renderHook(() => useRecipeImport({ onPreview }))

    await act(() => result.current.importFromUrl("https://example.com/blog"))

    expect(result.current.status).toBe("error")
    expect(result.current.error).toBe("No recipe data was found on that page.")
    expect(onPreview).not.toHaveBeenCalled()
  })

  it("shows a safe message when the action itself rejects", async () => {
    mockImport.mockRejectedValueOnce(new Error("Failed to fetch"))
    const { result } = renderHook(() => useRecipeImport({ onPreview: vi.fn() }))

    await act(() => result.current.importFromUrl("https://example.com/soup"))

    expect(result.current.error).toBe("We couldn't import that recipe right now. Please try again.")
  })

  it("ignores an earlier response that arrives after a newer request", async () => {
    const first = deferred()
    const second = deferred()
    mockImport.mockReturnValueOnce(first.promise).mockReturnValueOnce(second.promise)
    const onPreview = vi.fn()
    const { result } = renderHook(() => useRecipeImport({ onPreview }))

    let firstPending!: Promise<void>
    let secondPending!: Promise<void>
    act(() => {
      firstPending = result.current.importFromUrl("https://example.com/first")
    })
    act(() => {
      secondPending = result.current.importFromUrl("https://example.com/second")
    })

    await act(async () => {
      second.resolve({ ok: true, preview: previewNamed("second") })
      await secondPending
    })
    await act(async () => {
      first.resolve({ ok: true, preview: previewNamed("first") })
      await firstPending
    })

    expect(onPreview).toHaveBeenCalledTimes(1)
    expect(onPreview).toHaveBeenCalledWith(previewNamed("second"))
    expect(result.current.status).toBe("idle")
  })
})
