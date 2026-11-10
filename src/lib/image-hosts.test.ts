import { describe, it, expect } from "vitest"
import { isOwnImage } from "./image-hosts"

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
