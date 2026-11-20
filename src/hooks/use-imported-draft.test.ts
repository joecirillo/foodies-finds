// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { RecipeImportPreview } from "@/types/recipe"
import { useImportedDraft } from "./use-imported-draft"

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

const renderDraft = ({ isDirty }: { isDirty: boolean }) => {
  const hook = renderHook(() => useImportedDraft())
  act(() => hook.result.current.handleDirtyChange(isDirty))
  return hook
}

describe("useImportedDraft", () => {
  it("replaces a clean form immediately", () => {
    const { result } = renderDraft({ isDirty: false })

    act(() => result.current.receivePreview(previewNamed("Soup")))

    expect(result.current.isAwaitingReplaceConfirmation).toBe(false)
    expect(result.current.draft?.values.name).toBe("Soup")
    expect(result.current.draft?.context.source.sourceUrl).toBe("https://example.com/Soup")
    expect(result.current.formMountKey).toBe(1)
  })

  it("waits for confirmation before replacing an edited form", () => {
    const { result } = renderDraft({ isDirty: true })

    act(() => result.current.receivePreview(previewNamed("Soup")))

    expect(result.current.isAwaitingReplaceConfirmation).toBe(true)
    expect(result.current.draft).toBeNull()
    expect(result.current.formMountKey).toBe(0)
  })

  it("keeps the current draft when the replacement is cancelled", () => {
    const { result } = renderDraft({ isDirty: false })
    act(() => result.current.receivePreview(previewNamed("Soup")))
    act(() => result.current.handleDirtyChange(true))
    act(() => result.current.receivePreview(previewNamed("Stew")))

    act(() => result.current.cancelReplacement())

    expect(result.current.isAwaitingReplaceConfirmation).toBe(false)
    expect(result.current.draft?.values.name).toBe("Soup")
    expect(result.current.formMountKey).toBe(1)
  })

  it("remounts the form with the imported values when the replacement is accepted", () => {
    const { result } = renderDraft({ isDirty: true })
    act(() => result.current.receivePreview(previewNamed("Stew")))

    act(() => result.current.acceptReplacement())

    expect(result.current.isAwaitingReplaceConfirmation).toBe(false)
    expect(result.current.draft?.values.name).toBe("Stew")
    expect(result.current.formMountKey).toBe(1)
  })
})
