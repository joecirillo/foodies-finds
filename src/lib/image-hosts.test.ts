import { describe, it, expect } from "vitest"
import { isOwnImage, recipeImageProps } from "./image-hosts"

describe("recipeImageProps", () => {
  it.each([null, undefined, "  "])("falls back to the placeholder for %j", (imageUrl) => {
    expect(recipeImageProps(imageUrl)).toEqual({ src: "/no-image.jpeg", unoptimized: false })
  })

  it("skips the optimizer only for external images", () => {
    expect(recipeImageProps("https://images.seriouseats.com/soup.jpg")).toEqual({
      src: "https://images.seriouseats.com/soup.jpg",
      unoptimized: true,
    })
    expect(recipeImageProps("https://cdn.foodiesfinds.com/recipes/a.jpg").unoptimized).toBe(false)
  })
})

describe("isOwnImage", () => {
  it.each([
    "/no-image.jpeg",
    "recipes/abc-123.jpg",
    "https://cdn.foodiesfinds.com/recipes/abc.jpg",
    "https://pub-017886dc539b41789e7c76de04239c5d.r2.dev/recipes/abc.jpg",
  ])("treats %s as ours", (src) => {
    expect(isOwnImage(src)).toBe(true)
  })

  it.each([
    "https://images.seriouseats.com/soup.jpg",
    "https://cdn.foodiesfinds.com.evil.example/recipes/abc.jpg",
  ])("treats %s as external", (src) => {
    expect(isOwnImage(src)).toBe(false)
  })
})
