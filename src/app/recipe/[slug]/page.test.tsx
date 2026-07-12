// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import type { Recipe } from "@/types/recipe"

vi.mock("@/lib/api", () => ({ getRecipe: vi.fn() }))
vi.mock("next/navigation", () => ({ notFound: vi.fn() }))
vi.mock("next/image", () => ({
  default: ({ alt }: { alt: string }) => <img alt={alt} />,
}))
vi.mock("next/link", () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}))
vi.mock("@hugeicons/react", () => ({ HugeiconsIcon: () => null }))
vi.mock("@hugeicons/core-free-icons", async (importOriginal) => {
  const actual = await importOriginal()
  return { ...(actual as object) }
})
vi.mock("@/components/ui/button", () => ({
  Button: ({ children, ...props }: React.ComponentProps<"button">) => (
    <button {...props}>{children}</button>
  ),
}))

import { getRecipe } from "@/lib/api"
import RecipePage from "./page"

const mockGetRecipe = vi.mocked(getRecipe)

const baseRecipe: Recipe = {
  id: 1,
  name: "Test Recipe",
  description: null,
  calories: null,
  servings: 4,
  cookingTime: 30,
  preparationTime: 15,
  cuisine: null,
  tags: [],
  author: null,
  ingredients: [
    { id: 1, name: "zucchini", quantity: 2, notes: null, unitId: 1, unitName: "cup", abbreviation: "c" },
    { id: 2, name: "apple", quantity: 1, notes: null, unitId: 1, unitName: "cup", abbreviation: "c" },
    { id: 3, name: "mango", quantity: 3, notes: null, unitId: 1, unitName: "cup", abbreviation: "c" },
  ],
  steps: [{ stepId: 1, stepNumber: 1, description: "Mix everything", tip: null }],
  imageUrl: null,
  createdAt: "2024-01-01",
  updatedAt: "2024-01-01",
}

describe("RecipePage", () => {
  describe("ingredients", () => {
    it("displays ingredients in alphabetical order", async () => {
      mockGetRecipe.mockResolvedValueOnce(baseRecipe)

      const page = await RecipePage({
        params: Promise.resolve({ slug: "1" }),
        searchParams: Promise.resolve({}),
      })
      render(page)

      const items = screen.getAllByRole("listitem")
      const ingredientItems = items.filter((el) => el.querySelector("span.font-medium"))
      const names = ingredientItems.map((el) => el.querySelector("span.font-medium")?.textContent)

      expect(names).toEqual(["Apple", "Mango", "Zucchini"])
    })
  })
})
