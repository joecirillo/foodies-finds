import Image from "next/image"
import Link from "next/link"
import { Suspense } from "react"
import { filterRecipes, listRecipes } from "@/lib/api"
import { BrowseFilters } from "@/components/BrowseFilters"

export const dynamic = "force-dynamic"

const BrowsePage = async ({ searchParams }: { searchParams: Promise<Record<string, string>> }) => {
  const params = await searchParams
  const cuisineId = params.cuisineId ? Number(params.cuisineId) : undefined
  const tagId = params.tagId ? Number(params.tagId) : undefined
  const ingredientId = params.ingredientId ? Number(params.ingredientId) : undefined

  const hasFilters = cuisineId || tagId || ingredientId

  let recipes: { id: number; name: string }[] = []
  try {
    recipes = hasFilters
      ? await filterRecipes({ cuisineId, tagId, ingredientId })
      : await listRecipes()
  } catch {
    // Render empty state on failure
  }

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

      {recipes.length === 0 ? (
        <p className="text-base text-muted-foreground">No recipes found. Add one now!</p>
      ) : (
        <div className="grid grid-cols-3 gap-6 md:grid-cols-4">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10 transition-opacity active:opacity-80"
            >
              <div className="relative aspect-square w-full bg-muted">
                <Image src="/no-image.jpeg" alt={recipe.name} fill className="object-cover" />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">
                  {recipe.name}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default BrowsePage
