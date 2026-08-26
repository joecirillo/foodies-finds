import { describe, it, expect } from "vitest"
import { formatMinutes, formatQuantity } from "./format"

describe("formatMinutes", () => {
  it("formats minutes under an hour", () => {
    expect(formatMinutes(45)).toBe("45m")
  })

  it("formats whole hours without minutes", () => {
    expect(formatMinutes(120)).toBe("2h")
  })

  it("formats hours with remaining minutes", () => {
    expect(formatMinutes(150)).toBe("2h 30m")
  })
})

describe("formatQuantity", () => {
  it("returns an empty string for null quantity", () => {
    expect(formatQuantity(null, "cup")).toBe("")
  })

  it("rounds to hundredths instead of tenths", () => {
    expect(formatQuantity(1.333, "cup")).toBe("1.33 cup")
  })

  it("strips trailing zeros after rounding", () => {
    expect(formatQuantity(1.4, "cup")).toBe("1.4 cup")
  })

  it("renders whole numbers without a decimal", () => {
    expect(formatQuantity(2, "cup")).toBe("2 cup")
  })

  it("omits the unit when none is provided", () => {
    expect(formatQuantity(1.5, null)).toBe("1.5")
  })
})
