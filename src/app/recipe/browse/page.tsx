import Image from "next/image"
import Link from "next/link"
import { listRecipes } from "@/lib/api"

const BrowsePage = async () => {
  let recipes: { id: number; name: string }[] = []

  try {
    recipes = await listRecipes()
  } catch {
    // Render empty state on failure
  }

  return (
    <div className="mx-auto max-w-screen-sm px-4 pb-10">
      <h1 className="pt-6 pb-4 font-heading text-2xl font-semibold text-foreground">
        Browse Recipes
      </h1>

      {recipes.length === 0 ? (
        <p className="text-base text-muted-foreground">No recipes yet. Add one to get started!</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {recipes.map((recipe) => (
            <Link
              key={recipe.id}
              href={`/recipe/${recipe.id}`}
              className="rounded-2xl overflow-hidden bg-card ring-1 ring-foreground/10 shadow-sm active:opacity-80 transition-opacity"
            >
              <div className="relative w-full aspect-square bg-muted">
                <Image
                  src="/steak.jpeg"
                  alt={recipe.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-3">
                <p className="text-sm font-medium leading-snug text-foreground line-clamp-2">
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
