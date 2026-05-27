// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useRecipeSearch } from "./useRecipeSearch"

vi.mock("@/lib/api", () => ({
  searchRecipes: vi.fn(),
}))

import { searchRecipes } from "@/lib/api"
const mockSearchRecipes = vi.mocked(searchRecipes)

beforeEach(() => {
  vi.useFakeTimers()
  mockSearchRecipes.mockReset()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useRecipeSearch", () => {
  it("does not fetch when query is less than 2 chars", async () => {
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("a"))
    await act(() => vi.runAllTimersAsync())

    expect(mockSearchRecipes).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it("debounces fetch by 300ms", async () => {
    mockSearchRecipes.mockResolvedValue([{ id: 1, name: "Pasta" }])
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("pa"))
    expect(mockSearchRecipes).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(mockSearchRecipes).toHaveBeenCalledTimes(1)
  })

  it("sets loading true while fetching, false after", async () => {
    let resolve: (v: Array<{ id: number; name: string }>) => void
    mockSearchRecipes.mockReturnValue(
      new Promise((r) => { resolve = r })
    )
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("pa"))
    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(result.current.loading).toBe(true)

    await act(async () => { resolve([{ id: 1, name: "Pasta" }]) })
    expect(result.current.loading).toBe(false)
  })

  it("populates results on success", async () => {
    const data = [{ id: 1, name: "Pasta" }]
    mockSearchRecipes.mockResolvedValue(data)
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("pa"))
    await act(() => vi.runAllTimersAsync())

    expect(result.current.results).toEqual(data)
    expect(result.current.error).toBeNull()
  })

  it("sets error and clears results on fetch failure", async () => {
    mockSearchRecipes.mockRejectedValue(new Error("API 500"))
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("pa"))
    await act(() => vi.runAllTimersAsync())

    expect(result.current.error?.message).toBe("API 500")
    expect(result.current.results).toEqual([])
  })

  it("cancels debounce if query changes before timer fires", async () => {
    mockSearchRecipes.mockResolvedValue([{ id: 2, name: "Pizza" }])
    const { result } = renderHook(() => useRecipeSearch())

    act(() => result.current.setQuery("pa"))
    await act(() => vi.advanceTimersByTimeAsync(100))
    act(() => result.current.setQuery("piz"))
    await act(() => vi.runAllTimersAsync())

    expect(mockSearchRecipes).toHaveBeenCalledTimes(1)
    expect(mockSearchRecipes).toHaveBeenCalledWith("piz")
  })
})
