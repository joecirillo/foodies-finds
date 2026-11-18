"use client"

import { Button } from "@/components/ui/button"
import { RecipeGridCard } from "@/components/recipe/recipe-grid-card"
import { useLoadMoreRecipes } from "@/hooks/use-load-more-recipes"
import type { RecipeSearchResult } from "@/types/recipe"

type RecipeGridProps = {
  initialRecipes: RecipeSearchResult[]
  initialCursor: number | null
}

export const RecipeGrid = ({ initialRecipes, initialCursor }: RecipeGridProps) => {
  const { recipes, hasMore, isLoading, error, loadMore } = useLoadMoreRecipes(
    initialRecipes,
    initialCursor,
  )

  return (
    <>
      <div className="grid grid-cols-3 gap-6 md:grid-cols-4">
        {recipes.map((recipe) => (
          <RecipeGridCard key={recipe.id} recipe={recipe} />
        ))}
      </div>

      <div className="mt-8 flex flex-col items-center gap-3" aria-live="polite">
        {error && <p className="text-center text-sm text-destructive">{error}</p>}
        {hasMore && (
          <Button
            size="lg"
            variant="outline"
            className="w-full sm:w-auto sm:min-w-48"
            onClick={loadMore}
            disabled={isLoading}
          >
            {isLoading ? "Loading…" : "Load more recipes"}
          </Button>
        )}
      </div>
    </>
  )
}
