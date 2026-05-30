import Link from "next/link"
import { Button } from "@/components/ui/button"
import { RecipeOfTheDay } from "@/components/RecipeOfTheDay"
import { listRecipes, getRecipe } from "@/lib/api"
import { pickRandom } from "@/lib/utils/random"
import type { Recipe } from "@/types/recipe"

const HomePage = async () => {
  let initialRecipe: Recipe | null = null

  try {
    const recipes = await listRecipes()
    const picked = pickRandom(recipes)
    if (picked) initialRecipe = await getRecipe(picked.id)
  } catch {
    // Render without ROTD if fetch fails
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 pb-10">
      <section className="pt-10 pb-8 text-center">
        <h1 className="font-heading text-4xl font-bold tracking-tight text-foreground">
          Foodies Finds
        </h1>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          Your personal collection of homemade recipes. Save the dishes you love, share them with
          family, and never lose a great meal again.
        </p>
        <Button
          render={<Link href="/recipe/browse" />}
          nativeButton={false}
          size="lg"
          className="mt-6"
        >
          Browse Recipes
        </Button>
      </section>

      {initialRecipe && (
        <section>
          <h2 className="mb-4 font-heading text-xl font-semibold text-foreground">
            Recipe of the Day
          </h2>
          <RecipeOfTheDay initialRecipe={initialRecipe} />
        </section>
      )}
    </div>
  )
}

export default HomePage
