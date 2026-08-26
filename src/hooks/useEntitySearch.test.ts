// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest"
import { renderHook, act } from "@testing-library/react"
import { useEntitySearch } from "./useEntitySearch"

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function stubFetch(data: { id: number; name: string }[]) {
  const fetchMock = vi.fn().mockResolvedValue({
    json: () => Promise.resolve(data),
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

describe("useEntitySearch", () => {
  it("does not fetch for an empty query", async () => {
    const fetchMock = stubFetch([])
    const { result } = renderHook(() => useEntitySearch("/api/search/tags"))

    act(() => result.current.setQuery("   "))
    await act(() => vi.runAllTimersAsync())

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.results).toEqual([])
  })

  it("debounces the fetch by 300ms", async () => {
    const fetchMock = stubFetch([{ id: 1, name: "Italian" }])
    const { result } = renderHook(() => useEntitySearch("/api/search/cuisines"))

    act(() => result.current.setQuery("ita"))
    expect(fetchMock).not.toHaveBeenCalled()

    await act(() => vi.advanceTimersByTimeAsync(300))
    expect(fetchMock).toHaveBeenCalledWith("/api/search/cuisines?query=ita")
  })

  it("populates results and opens the dropdown on success", async () => {
    const data = [{ id: 1, name: "Italian" }]
    stubFetch(data)
    const { result } = renderHook(() => useEntitySearch("/api/search/cuisines"))

    act(() => result.current.setQuery("ita"))
    await act(() => vi.runAllTimersAsync())

    expect(result.current.results).toEqual(data)
    expect(result.current.open).toBe(true)
  })

  it("cancels the debounce if the query changes before the timer fires", async () => {
    const fetchMock = stubFetch([{ id: 2, name: "Mexican" }])
    const { result } = renderHook(() => useEntitySearch("/api/search/cuisines"))

    act(() => result.current.setQuery("ita"))
    await act(() => vi.advanceTimersByTimeAsync(100))
    act(() => result.current.setQuery("mex"))
    await act(() => vi.runAllTimersAsync())

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("/api/search/cuisines?query=mex")
  })

  it("clears results and closes the dropdown when the query is cleared", async () => {
    stubFetch([{ id: 1, name: "Italian" }])
    const { result } = renderHook(() => useEntitySearch("/api/search/cuisines"))

    act(() => result.current.setQuery("ita"))
    await act(() => vi.runAllTimersAsync())
    expect(result.current.results).not.toEqual([])

    act(() => result.current.setQuery(""))
    await act(() => vi.runAllTimersAsync())

    expect(result.current.results).toEqual([])
    expect(result.current.open).toBe(false)
  })
})
