// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook } from "@testing-library/react"
import { useScrollToField } from "./use-scroll-to-field"

const scrollIntoView = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  scrollIntoView.mockReset()
  window.HTMLElement.prototype.scrollIntoView = scrollIntoView
  document.body.innerHTML = '<div id="field-name"></div><div id="field-steps"></div>'
})

afterEach(() => {
  vi.useRealTimers()
  document.body.innerHTML = ""
})

describe("useScrollToField", () => {
  it("scrolls the field into view after a short delay", () => {
    const { result } = renderHook(() => useScrollToField())

    result.current("name")
    expect(scrollIntoView).not.toHaveBeenCalled()
    vi.advanceTimersByTime(50)

    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: "smooth", block: "center" })
  })

  it("only scrolls to the most recent field", () => {
    const { result } = renderHook(() => useScrollToField())

    result.current("name")
    result.current("steps")
    vi.advanceTimersByTime(50)

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    expect(scrollIntoView.mock.contexts[0]).toBe(document.getElementById("field-steps"))
  })

  it("cancels a pending scroll when the form unmounts", () => {
    const { result, unmount } = renderHook(() => useScrollToField())

    result.current("name")
    unmount()
    vi.advanceTimersByTime(50)

    expect(scrollIntoView).not.toHaveBeenCalled()
  })
})
