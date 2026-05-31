import { describe, it, expect, vi } from "vitest"
import { pickRandom } from "./random"

describe("pickRandom", () => {
  it("returns undefined for an empty array", () => {
    expect(pickRandom([])).toBeUndefined()
  })

  it("returns the only element when array has one item", () => {
    expect(pickRandom([42])).toBe(42)
  })

  it("returns an element that exists in the array", () => {
    const arr = [10, 20, 30, 40, 50]
    const result = pickRandom(arr)
    expect(arr).toContain(result)
  })

  it("never returns an out-of-bounds value", () => {
    const arr = ["a", "b", "c"]
    vi.spyOn(Math, "random").mockReturnValue(0.9999)
    expect(arr).toContain(pickRandom(arr))
    vi.restoreAllMocks()
  })

  it("uses Math.random to determine the index", () => {
    const arr = ["x", "y", "z"]
    vi.spyOn(Math, "random").mockReturnValue(0)
    expect(pickRandom(arr)).toBe("x")
    vi.spyOn(Math, "random").mockReturnValue(0.5)
    expect(pickRandom(arr)).toBe("y")
    vi.restoreAllMocks()
  })
})
