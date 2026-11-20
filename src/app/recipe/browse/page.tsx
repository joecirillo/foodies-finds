import { Suspense } from "react"
import { filterRecipes, listRecipes } from "@/lib/api"
import { BrowseFilters } from "@/components/BrowseFilters"
import { BrowseLoadError } from "@/components/recipe/browse-load-error"
import { RecipeGrid } from "@/components/recipe/recipe-grid"
import type { RecipeListPage } from "@/types/recipe"

export const dynamic = "force-dynamic"

const BrowsePage = async ({ searchParams }: { searchParams: Promise<Record<string, string>> }) => {
  const params = await searchParams
  const cuisineId = params.cuisineId ? Number(params.cuisineId) : undefined
  const tagId = params.tagId ? Number(params.tagId) : undefined
  const ingredientId = params.ingredientId ? Number(params.ingredientId) : undefined

  const hasFilters = cuisineId || tagId || ingredientId

  const loadFirstPage = async (): Promise<RecipeListPage> =>
    hasFilters
      ? { recipes: await filterRecipes({ cuisineId, tagId, ingredientId }), nextCursor: null }
      : listRecipes()

  const page = await loadFirstPage().catch((err: unknown) => {
    console.error("Failed to load browse recipes:", err instanceof Error ? err.message : err)
    return null
  })

  return (
    <div className="mx-auto max-w-screen-sm px-4 pb-10 md:max-w-3xl lg:max-w-5xl">
      <h1 className="pt-6 pb-4 font-heading text-2xl font-semibold text-foreground">
        Browse Recipes
      </h1>

      <div className="mb-4">
        <Suspense>
          <BrowseFilters />
        </Suspense>
      </div>

      {page === null ? (
        <BrowseLoadError />
      ) : page.recipes.length === 0 ? (
        <p className="text-base text-muted-foreground">No recipes found. Add one now!</p>
      ) : (
        <RecipeGrid
          key={JSON.stringify({ cuisineId, tagId, ingredientId })}
          initialRecipes={page.recipes}
          initialCursor={page.nextCursor}
        />
      )}
    </div>
  )
}

export default BrowsePage
