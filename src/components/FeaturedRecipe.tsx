"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { HugeiconsIcon } from "@hugeicons/react"
import { TimeIcon, FireIcon, UserIcon, Loading03Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"
import { formatMinutes } from "@/lib/utils/format"
import { toTitleCase } from "@/lib/utils/text"
import type { Recipe } from "@/types/recipe"

export const RecipeOfTheDay = ({ initialRecipe }: { initialRecipe: Recipe }) => {
  const [currentRecipe, setCurrentRecipe] = useState<Recipe>(initialRecipe)
  const [loading, setLoading] = useState(false)

  const handleTryAnother = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/recipes/random")
      if (res.ok) {
        const recipe: Recipe = await res.json()
        setCurrentRecipe(recipe)
      }
    } finally {
      setLoading(false)
    }
  }

  const totalTime = currentRecipe.preparationTime + currentRecipe.cookingTime

  return (
    <div className="rounded-2xl overflow-hidden bg-card ring-1 ring-foreground/10 shadow-sm">
      <div className="relative w-full aspect-4/3 bg-muted">
        <Image
          src={currentRecipe.imageUrl?.trim() ? currentRecipe.imageUrl : "/no-image.jpeg"}
          alt={currentRecipe.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="p-4">
        {(currentRecipe.cuisine || currentRecipe.tags.length > 0) && (
          <div className="mb-2 flex flex-wrap gap-1.5">
            {currentRecipe.cuisine && (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                {currentRecipe.cuisine.name}
              </span>
            )}
            {currentRecipe.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {toTitleCase(tag.name)}
              </span>
            ))}
          </div>
        )}

        <h3 className="font-heading text-xl font-semibold leading-tight text-foreground">
          {currentRecipe.name}
        </h3>

        {currentRecipe.description && (
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground line-clamp-2">
            {currentRecipe.description}
          </p>
        )}

        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          {totalTime > 0 && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <HugeiconsIcon icon={TimeIcon} className="size-4 text-primary" />
              {formatMinutes(totalTime)}
            </span>
          )}
          {currentRecipe.servings && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <HugeiconsIcon icon={UserIcon} className="size-4 text-primary" />
              {currentRecipe.servings} servings
            </span>
          )}
          {currentRecipe.calories && (
            <span className="flex items-center gap-1 text-muted-foreground">
              <HugeiconsIcon icon={FireIcon} className="size-4 text-orange-500" />
              {currentRecipe.calories} kcal
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            render={<Link href={`/recipe/${currentRecipe.id}`} />}
            nativeButton={false}
            className="flex-1"
          >
            View Recipe
          </Button>
          <Button
            variant="outline"
            onClick={handleTryAnother}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />
            ) : (
              "Try Another"
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
