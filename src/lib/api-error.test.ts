import { describe, it, expect } from "vitest"
import { apiError, isApiError } from "./api-error"

const responseWith = (status: number, body: Promise<unknown>) =>
  ({ status, json: () => body }) as Response

describe("apiError", () => {
  it("uses the envelope message and the status as the code", async () => {
    const err = await apiError(responseWith(404, Promise.resolve({ message: "Recipe not found" })))

    expect(err.message).toBe("Recipe not found")
    expect(err.code).toBe("404")
    expect(err.errorCode).toBeUndefined()
  })

  it("keeps the envelope's error code when one is set", async () => {
    const err = await apiError(
      responseWith(422, Promise.resolve({ message: "No recipe found", code: "NO_RECIPE_FOUND" })),
    )

    expect(err.errorCode).toBe("NO_RECIPE_FOUND")
  })

  it("falls back to the status when the body is not JSON", async () => {
    const err = await apiError(responseWith(502, Promise.reject(new Error("not json"))))

    expect(err.message).toBe("API 502")
    expect(err.code).toBe("502")
  })
})

describe("isApiError", () => {
  it("accepts errors built by apiError", async () => {
    const err = await apiError(responseWith(500, Promise.resolve({})))

    expect(isApiError(err)).toBe(true)
  })

  it("rejects plain errors and non-errors", () => {
    expect(isApiError(new Error("boom"))).toBe(false)
    expect(isApiError({ message: "boom", code: "500" })).toBe(false)
    expect(isApiError(null)).toBe(false)
  })
})
