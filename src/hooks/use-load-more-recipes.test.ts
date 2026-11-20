// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest"
import { act, renderHook } from "@testing-library/react"
import type { RecipeListPage } from "@/types/recipe"

vi.mock("@/lib/api-client", () => ({
  loadMoreRecipes: vi.fn(),
}))

import { loadMoreRecipes } from "@/lib/api-client"
import type { ApiError } from "@/lib/api-error"
import { useLoadMoreRecipes } from "./use-load-more-recipes"

const mockLoadMore = vi.mocked(loadMoreRecipes)

const recipe = (id: number) => ({ id, name: `Recipe ${id}` })

const deferred = () => {
  let resolve!: (value: RecipeListPage) => void
  const promise = new Promise<RecipeListPage>((r) => (resolve = r))
  return { promise, resolve }
}

beforeEach(() => {
  mockLoadMore.mockReset()
})

describe("useLoadMoreRecipes", () => {
  it("appends the next page and advances the cursor", async () => {
    mockLoadMore.mockResolvedValueOnce({ recipes: [recipe(2)], nextCursor: "c2" })
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(3)], "c3"))

    await act(() => result.current.loadMore())

    expect(mockLoadMore).toHaveBeenCalledWith("c3")
    expect(result.current.recipes.map((r) => r.id)).toEqual([3, 2])
    expect(result.current.hasMore).toBe(true)
  })

  it("reports no more recipes once the last page arrives", async () => {
    mockLoadMore.mockResolvedValueOnce({ recipes: [recipe(1)], nextCursor: null })
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(2)], "c2"))

    await act(() => result.current.loadMore())

    expect(result.current.hasMore).toBe(false)
  })

  it("does nothing when there is no next page", async () => {
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(1)], null))

    await act(() => result.current.loadMore())

    expect(mockLoadMore).not.toHaveBeenCalled()
  })

  it("ignores repeat taps while a page is loading", async () => {
    const request = deferred()
    mockLoadMore.mockReturnValueOnce(request.promise)
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(3)], "c3"))

    act(() => {
      void result.current.loadMore()
    })
    expect(result.current.isLoading).toBe(true)
    await act(() => result.current.loadMore())
    await act(async () => request.resolve({ recipes: [recipe(2)], nextCursor: null }))

    expect(mockLoadMore).toHaveBeenCalledTimes(1)
    expect(result.current.isLoading).toBe(false)
  })

  it("ignores a second tap that lands before React re-renders", async () => {
    mockLoadMore.mockResolvedValueOnce({ recipes: [recipe(2)], nextCursor: null })
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(3)], "c3"))

    await act(async () => {
      const { loadMore } = result.current
      await Promise.all([loadMore(), loadMore()])
    })

    expect(mockLoadMore).toHaveBeenCalledTimes(1)
    expect(result.current.recipes.map((r) => r.id)).toEqual([3, 2])
  })

  it("shows the API message and keeps the cursor so the user can retry", async () => {
    const error = Object.assign(new Error("Invalid cursor"), { code: "400" }) as ApiError
    mockLoadMore.mockRejectedValueOnce(error)
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(3)], "c3"))

    await act(() => result.current.loadMore())

    expect(result.current.error).toBe("Invalid cursor")
    expect(result.current.hasMore).toBe(true)
    expect(result.current.recipes).toHaveLength(1)
  })

  it("falls back to a friendly message for network failures", async () => {
    mockLoadMore.mockRejectedValueOnce(new TypeError("Failed to fetch"))
    const { result } = renderHook(() => useLoadMoreRecipes([recipe(3)], "c3"))

    await act(() => result.current.loadMore())

    expect(result.current.error).toBe("Couldn't load more recipes. Please try again.")
  })
})
