import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  Edit02Icon,
  TimeIcon,
  FireIcon,
  UserIcon,
} from "@hugeicons/core-free-icons"
import { getRecipe } from "@/lib/api"
import { formatMinutes, formatQuantity } from "@/lib/utils/format"
import { toTitleCase, toSentenceCase, lowerFirst } from "@/lib/utils/text"
import { Button } from "@/components/ui/button"
import type { Recipe } from "@/types/recipe"

const MetaItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode
  label: string
  value: string
}) => (
  <div className="flex items-center gap-1.5 text-base">
    <span className="text-primary">{icon}</span>
    <span className="text-muted-foreground">{label}:</span>
    <span className="font-medium">{value}</span>
  </div>
)

const RecipePage = async (props: PageProps<"/recipe/[slug]">) => {
  const { slug } = await props.params

  let recipe: Recipe
  try {
    recipe = await getRecipe(slug)
  } catch (err) {
    const code = (err as NodeJS.ErrnoException).code
    if (code === "404") notFound()
    throw err
  }

  const totalTime = recipe.preparationTime + recipe.cookingTime

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-sm border-b border-border">
        <Button
          render={<Link href="/recipe/browse" />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
        </Button>
        <Button
          render={<Link href={`/recipe/${slug}/edit`} />}
          nativeButton={false}
          variant="outline"
          size="sm"
          className="gap-1.5"
        >
          <HugeiconsIcon icon={Edit02Icon} className="size-4" />
          Edit
        </Button>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 pt-5">
        {(recipe.cuisine || recipe.tags.length > 0) && (
          <div className="mb-3 flex flex-wrap gap-1.5">
            {recipe.cuisine && (
              <span className="rounded-full bg-primary/10 px-3 py-0.5 text-xs font-medium text-primary">
                {recipe.cuisine.name}
              </span>
            )}
            {recipe.tags.map((tag) => (
              <span
                key={tag.id}
                className="rounded-full bg-secondary px-3 py-0.5 text-xs font-medium text-secondary-foreground"
              >
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground">
          {recipe.name}
        </h1>

        {recipe.author && (
          <p className="mt-1 flex items-center gap-1 text-base text-muted-foreground">
            <HugeiconsIcon icon={UserIcon} className="size-3.5" />
            {recipe.author}
          </p>
        )}

        <div className="relative mt-4 w-full aspect-4/3 overflow-hidden rounded-2xl bg-muted">
          <Image
            src={recipe.imageUrl?.trim() ? recipe.imageUrl : "/no-image.jpeg"}
            alt={recipe.name}
            fill
            className="object-cover"
            priority
          />
        </div>

        {recipe.description && (
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            {recipe.description}
          </p>
        )}

        <div className="mt-4 flex flex-wrap gap-4">
          <MetaItem
            icon={<HugeiconsIcon icon={TimeIcon} className="size-4" />}
            label="Total time"
            value={formatMinutes(totalTime)}
          />
          <MetaItem
            icon={<HugeiconsIcon icon={TimeIcon} className="size-4 text-muted-foreground" />}
            label="Prep"
            value={formatMinutes(recipe.preparationTime)}
          />
          <MetaItem
            icon={<HugeiconsIcon icon={FireIcon} className="size-4" />}
            label="Cook"
            value={formatMinutes(recipe.cookingTime)}
          />
          <MetaItem
            icon={<HugeiconsIcon icon={UserIcon} className="size-4" />}
            label="Serves"
            value={String(recipe.servings)}
          />
          <MetaItem
            icon={<HugeiconsIcon icon={FireIcon} className="size-4 text-orange-500" />}
            label="Calories"
            value={recipe.calories ? `${recipe.calories}` : "N/A"}
          />
        </div>

        <section className="mt-7">
          <h2 className="mb-3 font-heading text-lg font-semibold">
            Ingredients
            <span className="ml-1.5 text-sm font-normal text-muted-foreground">
              ({recipe.ingredients.length})
            </span>
          </h2>
          <ul className="space-y-2">
            {recipe.ingredients.map((ingredient, index) => (
              <li
                key={`${ingredient.id}-${index}`}
                className="flex items-start gap-3 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10"
              >
                <span className="mt-1.5 size-2 shrink-0 rounded-full bg-primary/60" />
                <div className="flex-1 min-w-0">
                  <span className="text-base font-medium">{toTitleCase(ingredient.name)}</span>
                  <span className="ml-1.5 text-base text-muted-foreground">
                    {formatQuantity(
                      ingredient.quantity,
                      ingredient.abbreviation ?? ingredient.unitName,
                    )}
                  </span>
                  {ingredient.notes && (
                    <p className="mt-0.5 text-sm text-muted-foreground">{ingredient.notes}</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="mb-3 font-heading text-lg font-semibold">Steps</h2>
          <ol className="space-y-3">
            {recipe.steps
              .sort((a, b) => a.stepNumber - b.stepNumber)
              .map((step) => (
                <li key={step.stepId} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-0.5">
                    {step.stepNumber}
                  </span>
                  <div className="flex-1 pb-1">
                    <p className="text-base leading-relaxed">{toSentenceCase(step.description)}</p>
                    {step.tip && (
                      <p className="mt-1.5 rounded-lg bg-secondary/60 px-3 py-2 text-sm text-secondary-foreground">
                        Tip: {lowerFirst(step.tip)}
                      </p>
                    )}
                  </div>
                </li>
              ))}
          </ol>
        </section>
      </div>
    </div>
  )
}

export default RecipePage
