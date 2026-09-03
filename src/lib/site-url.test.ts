import { describe, it, expect, afterEach } from "vitest"
import { getSiteUrl } from "./site-url"

describe("getSiteUrl", () => {
  const originalProductionUrl = process.env.VERCEL_PROJECT_PRODUCTION_URL

  afterEach(() => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = originalProductionUrl
  })

  it("uses the Vercel production URL when set", () => {
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "foodiesfinds.com"

    expect(getSiteUrl()).toBe("https://foodiesfinds.com")
  })

  it("falls back to localhost when unset", () => {
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL

    expect(getSiteUrl()).toBe("http://localhost:3000")
  })
})
