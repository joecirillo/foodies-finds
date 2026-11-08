import { describe, expect, it } from "vitest"
import { validateIngredients } from "./ingredient-validation"

describe("validateIngredients", () => {
  it.each([
    ["", null],
    ["2", null],
    ["", 1],
    ["1 1/2", 1],
    ["½", null],
    ["999999.99", null],
  ])("accepts quantity %j and unit %s", (quantityText, unitId) => {
    expect(validateIngredients([{ name: "Salt", quantityText, unitId }])).toEqual({})
  })

  it.each([
    ["abc", "Enter a number like 2, 0.5 or 1 1/2"],
    ["1/0", "Enter a number like 2, 0.5 or 1 1/2"],
    ["0", "Quantity must be greater than zero"],
    ["-2", "Quantity must be greater than zero"],
    ["0.001", "Quantity must be greater than zero"],
    ["-1/2", "Quantity must be greater than zero"],
    ["1000000", "Quantity must be less than 1,000,000"],
  ])("rejects supplied quantity %j even beside a valid row", (quantityText, message) => {
    expect(
      validateIngredients([
        { name: "Salt", quantityText: "1", unitId: 1 },
        { name: "Pepper", quantityText, unitId: null },
      ]),
    ).toEqual({ "ingredient-1-quantity": message })
  })

  it.each([0, -1, 1.5, NaN, Infinity])("rejects supplied unit %s", (unitId) => {
    expect(validateIngredients([{ name: "Salt", quantityText: "", unitId }])).toHaveProperty(
      "ingredient-0-unit",
    )
  })

  it("ignores quantities on unnamed rows", () => {
    expect(
      validateIngredients([
        { name: "Salt", quantityText: "", unitId: null },
        { name: "", quantityText: "abc", unitId: null },
      ]),
    ).toEqual({})
  })

  it("requires at least one named ingredient", () => {
    expect(validateIngredients([{ name: "  ", quantityText: "1", unitId: 1 }])).toHaveProperty(
      "ingredients",
    )
  })
})
