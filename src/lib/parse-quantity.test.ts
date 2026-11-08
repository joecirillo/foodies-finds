import { describe, expect, it } from "vitest"
import { formatQuantityInput, parseQuantity } from "./parse-quantity"

describe("parseQuantity", () => {
  it.each([
    ["2", 2],
    ["0.5", 0.5],
    [".5", 0.5],
    ["1,5", 1.5],
    ["1/2", 0.5],
    ["1 / 2", 0.5],
    ["1 1/2", 1.5],
    ["1-1/2", 1.5],
    ["½", 0.5],
    ["1½", 1.5],
    ["1 ½", 1.5],
    ["1⁄4", 0.25],
    ["1/3", 0.33],
    ["  3  ", 3],
    ["-2", -2],
  ])("parses %j as %s", (text, expected) => {
    expect(parseQuantity(text)).toBe(expected)
  })

  it.each(["", "   "])("treats %j as no quantity", (text) => {
    expect(parseQuantity(text)).toBeNull()
  })

  it.each(["abc", "1/0", "1 1/0", "2 cups", "1..2", "--1", "1/2/3", "a pinch"])(
    "reports %j as unparseable",
    (text) => {
      expect(parseQuantity(text)).toBeNaN()
    },
  )
})

describe("formatQuantityInput", () => {
  it("formats a stored quantity for editing", () => {
    expect(formatQuantityInput(0.5)).toBe("0.5")
    expect(formatQuantityInput(null)).toBe("")
  })
})
