import { describe, it, expect } from "vitest"
import { toTitleCase, toSentenceCase, lowerFirst } from "./text"

describe("toTitleCase", () => {
  it("capitalizes simple multi-word string", () => {
    expect(toTitleCase("olive oil")).toBe("Olive Oil")
  })

  it("capitalizes each hyphen-separated part", () => {
    expect(toTitleCase("gluten-free")).toBe("Gluten-Free")
  })

  it("handles mixed hyphenated and non-hyphenated words", () => {
    expect(toTitleCase("gluten-free flour")).toBe("Gluten-Free Flour")
  })

  it("passes through already correct input", () => {
    expect(toTitleCase("Olive Oil")).toBe("Olive Oil")
  })

  it("returns empty string for empty input", () => {
    expect(toTitleCase("")).toBe("")
  })
})

describe("toSentenceCase", () => {
  it("capitalizes a single sentence", () => {
    expect(toSentenceCase("stir the pot")).toBe("Stir the pot")
  })

  it("capitalizes each sentence separated by periods", () => {
    expect(toSentenceCase("stir the pot. add salt. enjoy.")).toBe("Stir the pot. Add salt. Enjoy.")
  })

  it("handles exclamation and question marks", () => {
    expect(toSentenceCase("stir! add salt.")).toBe("Stir! Add salt.")
  })

  it("passes through already correct input", () => {
    expect(toSentenceCase("Stir the pot. Add salt.")).toBe("Stir the pot. Add salt.")
  })

  it("returns empty string for empty input", () => {
    expect(toSentenceCase("")).toBe("")
  })
})

describe("lowerFirst", () => {
  it("lowercases the first letter", () => {
    expect(lowerFirst("Add salt")).toBe("add salt")
  })

  it("passes through already lowercase input", () => {
    expect(lowerFirst("add salt")).toBe("add salt")
  })

  it("returns empty string for empty input", () => {
    expect(lowerFirst("")).toBe("")
  })
})
