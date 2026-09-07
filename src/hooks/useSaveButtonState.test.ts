// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { renderHook } from "@testing-library/react"
import { useSaveButtonState } from "./useSaveButtonState"

describe("useSaveButtonState", () => {
  it("is idle with the given label when neither submitting nor processing an image", () => {
    const { result } = renderHook(() =>
      useSaveButtonState({
        isSubmitting: false,
        isProcessingImage: false,
        idleLabel: "Save Recipe",
      }),
    )

    expect(result.current).toEqual({ isBusy: false, label: "Save Recipe" })
  })

  it("shows 'Saving…' and is busy while submitting", () => {
    const { result } = renderHook(() =>
      useSaveButtonState({
        isSubmitting: true,
        isProcessingImage: false,
        idleLabel: "Save Recipe",
      }),
    )

    expect(result.current).toEqual({ isBusy: true, label: "Saving…" })
  })

  it("shows 'Processing photo…' and is busy while processing an image", () => {
    const { result } = renderHook(() =>
      useSaveButtonState({
        isSubmitting: false,
        isProcessingImage: true,
        idleLabel: "Save Recipe",
      }),
    )

    expect(result.current).toEqual({ isBusy: true, label: "Processing photo…" })
  })

  it("prioritizes the 'Saving…' label when both submitting and processing an image are true", () => {
    const { result } = renderHook(() =>
      useSaveButtonState({ isSubmitting: true, isProcessingImage: true, idleLabel: "Save Recipe" }),
    )

    expect(result.current).toEqual({ isBusy: true, label: "Saving…" })
  })
})
