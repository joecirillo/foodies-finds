import Image from "next/image"
import Link from "next/link"
import { recipeImageProps } from "@/lib/image-hosts"
import type { RecipeSearchResult } from "@/types/recipe"

export const RecipeGridCard = ({ recipe }: { recipe: RecipeSearchResult }) => (
  <Link
    href={`/recipe/${recipe.id}`}
    className="overflow-hidden rounded-2xl bg-card shadow-sm ring-1 ring-foreground/10 transition-opacity active:opacity-80"
  >
    <div className="relative aspect-square w-full bg-muted">
      <Image
        {...recipeImageProps(recipe.imageUrl)}
        alt={recipe.name}
        fill
        sizes="(min-width: 1024px) 230px, (min-width: 768px) 165px, 33vw"
        className="object-cover"
      />
    </div>
    <div className="p-3">
      <p className="line-clamp-2 text-sm font-medium leading-snug text-foreground">{recipe.name}</p>
    </div>
  </Link>
)
