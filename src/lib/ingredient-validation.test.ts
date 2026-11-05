import { describe, expect, it } from "vitest"
import { validateIngredients } from "./ingredient-validation"

describe("validateIngredients", () => {
  it.each([
    [null, null],
    [2, null],
    [null, 1],
    [2, 1],
  ])("accepts quantity %s and unit %s", (quantity, unitId) => {
    expect(validateIngredients([{ name: "Salt", quantity, unitId }])).toEqual({})
  })

  it.each([0, -1, NaN, Infinity])(
    "rejects supplied quantity %s even beside a valid row",
    (quantity) => {
      expect(
        validateIngredients([
          { name: "Salt", quantity: 1, unitId: 1 },
          { name: "Pepper", quantity, unitId: null },
        ]),
      ).toHaveProperty("ingredient-1-quantity")
    },
  )

  it.each([0, -1, 1.5, NaN, Infinity])("rejects supplied unit %s", (unitId) => {
    expect(validateIngredients([{ name: "Salt", quantity: null, unitId }])).toHaveProperty(
      "ingredient-0-unit",
    )
  })

  it("requires at least one named ingredient", () => {
    expect(validateIngredients([{ name: "  ", quantity: 1, unitId: 1 }])).toHaveProperty(
      "ingredients",
    )
  })
})
