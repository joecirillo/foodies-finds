"use client"

import { useState, useRef, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import {
  ArrowLeft02Icon,
  PlusSignIcon,
  Delete02Icon,
  DragDropVerticalIcon,
  Loading03Icon,
} from "@hugeicons/core-free-icons"
import { CuisinePicker } from "@/components/recipe/CuisinePicker"
import {
  FieldError,
  FieldLabel,
  SectionHeading,
  textareaClass,
} from "@/components/recipe/RecipeFormFields"
import { TagPicker } from "@/components/recipe/TagPicker"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  updateRecipeAction,
  presignRecipeImageUploadAction,
  deleteRecipeImageAction,
} from "@/app/actions/recipe"
import { useSaveButtonState } from "@/hooks/useSaveButtonState"
import { useStepRows } from "@/hooks/useStepRows"
import { ACCEPTED_IMAGE_TYPES, prepareImageFile, putToPresignedUrl } from "@/lib/upload"
import { diffRecipeForUpdate } from "@/lib/recipe-diff"
import { toSentenceCase, lowerFirst, toTitleCase } from "@/lib/utils/text"
import type { EntityOption, Recipe, SaveRecipeRequest, Unit, IngredientRow } from "@/types/recipe"

type SearchResult = { id: number; name: string }

export const EditRecipeForm = ({ recipe }: { recipe: Recipe }) => {
  const router = useRouter()
  const keyCounter = useRef(1)
  const nextKey = () => ++keyCounter.current

  const [name, setName] = useState(recipe.name)
  const [description, setDescription] = useState(recipe.description ?? "")
  const [author, setAuthor] = useState(recipe.author ?? "")
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [isProcessingImage, setIsProcessingImage] = useState(false)
  const existingImageUrl = recipe.imageUrl ?? null
  const [preparationTime, setPreparationTime] = useState(
    recipe.preparationTime > 0 ? String(recipe.preparationTime) : "",
  )
  const [cookingTime, setCookingTime] = useState(
    recipe.cookingTime > 0 ? String(recipe.cookingTime) : "",
  )
  const [servings, setServings] = useState(recipe.servings != null ? String(recipe.servings) : "")
  const [calories, setCalories] = useState(recipe.calories != null ? String(recipe.calories) : "")

  const [selectedCuisine, setSelectedCuisine] = useState<EntityOption | null>(
    recipe.cuisine ?? null,
  )
  const [selectedTags, setSelectedTags] = useState<EntityOption[]>(recipe.tags)

  const [ingredients, setIngredients] = useState<IngredientRow[]>(
    recipe.ingredients.length > 0
      ? recipe.ingredients.map((ing, i) => ({
          key: i,
          name: ing.name,
          unitId: ing.unitId,
          quantity: ing.quantity,
          notes: ing.notes ?? "",
          searchResults: [],
          dropdownOpen: false,
        }))
      : [
          {
            key: 0,
            name: "",
            unitId: null,
            quantity: 1,
            notes: "",
            searchResults: [],
            dropdownOpen: false,
          },
        ],
  )

  const { steps, stepsListRef, addStep, removeStep, updateStep, dragHandlersFor } = useStepRows({
    initialSteps:
      recipe.steps.length > 0
        ? [...recipe.steps]
            .sort((a, b) => a.stepNumber - b.stepNumber)
            .map((s, i) => ({
              key: i,
              description: s.description,
              tip: s.tip ?? "",
            }))
        : [{ key: 0, description: "", tip: "" }],
  })

  const [units, setUnits] = useState<Unit[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isBusy: isSaveBusy, label: saveLabel } = useSaveButtonState({
    isSubmitting,
    isProcessingImage,
    idleLabel: "Save Changes",
  })

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    // Steps get their own counter inside useStepRows, so this only needs to
    // stay ahead of existing ingredient keys.
    keyCounter.current = recipe.ingredients.length
    fetch("/api/units")
      .then((r) => r.json())
      .then((data: Unit[]) => setUnits(data))
      .catch(() => {})
  }, [recipe.ingredients.length])

  const debounce = (key: string, fn: () => void, delay = 300) => {
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(fn, delay)
  }

  const updateIngredient = (index: number, updates: Partial<IngredientRow>) => {
    setIngredients((prev) => prev.map((row, i) => (i === index ? { ...row, ...updates } : row)))
  }

  const handleIngredientNameChange = (index: number, query: string) => {
    updateIngredient(index, {
      name: query,
      dropdownOpen: false,
      searchResults: [],
    })
    if (!query.trim()) return
    debounce(`ingredient-${index}`, async () => {
      const res = await fetch(`/api/search/ingredients?query=${encodeURIComponent(query)}`)
      const data: SearchResult[] = await res.json()
      setIngredients((prev) =>
        prev.map((row, i) =>
          i === index ? { ...row, searchResults: data, dropdownOpen: true } : row,
        ),
      )
    })
  }

  const addIngredient = () => {
    setIngredients((prev) => [
      ...prev,
      {
        key: nextKey(),
        name: "",
        unitId: null,
        quantity: null,
        notes: "",
        searchResults: [],
        dropdownOpen: false,
      },
    ])
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const validate = () => {
    const newErrors: Record<string, string> = {}

    if (!name.trim()) newErrors.name = "Recipe name is required"

    const prepTime = parseInt(preparationTime)
    if (!preparationTime || isNaN(prepTime) || prepTime < 1)
      newErrors.preparationTime = "Preparation time must be at least 1 minute"

    const cookTime = parseInt(cookingTime)
    if (cookingTime !== "" && (isNaN(cookTime) || cookTime < 0))
      newErrors.cookingTime = "Cooking time must be 0 or more"

    if (!selectedCuisine) newErrors.cuisine = "Cuisine is required"

    const validIngredients = ingredients.filter(
      (i) => i.name.trim() && i.quantity !== null && i.quantity > 0,
    )
    if (validIngredients.length === 0)
      newErrors.ingredients = "At least one ingredient with a name and quantity is required"

    const validSteps = steps.filter((s) => s.description.trim())
    if (validSteps.length === 0)
      newErrors.steps = "At least one step with a description is required"

    setErrors(newErrors)

    const firstKey = Object.keys(newErrors)[0]
    if (firstKey) {
      setTimeout(() => {
        document
          .getElementById(`field-${firstKey}`)
          ?.scrollIntoView({ behavior: "smooth", block: "center" })
      }, 50)
    }

    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validate()) return
    setIsSubmitting(true)
    setSubmitError(null)

    let newImageKey: string | null = null

    if (imageFile) {
      const presign = await presignRecipeImageUploadAction(imageFile.type, imageFile.size)
      if (!presign.ok) {
        setErrors((prev) => ({ ...prev, image: presign.error }))
        setIsSubmitting(false)
        return
      }
      try {
        await putToPresignedUrl(presign.uploadUrl, imageFile)
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to upload image"
        console.error("Image upload to R2 failed:", err)
        setErrors((prev) => ({ ...prev, image: message }))
        setIsSubmitting(false)
        return
      }
      newImageKey = presign.key
    }

    const nextPayload: SaveRecipeRequest = {
      name: toTitleCase(name.trim()),
      description: description.trim() || null,
      calories: calories ? parseInt(calories) : 0,
      servings: servings ? parseInt(servings) : null,
      cookingTime: cookingTime ? parseInt(cookingTime) : 0,
      preparationTime: parseInt(preparationTime),
      cuisine: selectedCuisine,
      tags: selectedTags.map((tag) => ({ ...tag, name: tag.name.trim().replace(/\s+/g, "-") })),
      author: author.trim() || null,
      ingredients: ingredients
        .filter((i) => i.name.trim() && i.quantity !== null && i.quantity > 0)
        .map((i) => ({
          id: null,
          name: toTitleCase(i.name.trim()),
          unitId: i.unitId,
          quantity: i.quantity,
          notes: i.notes.trim() || null,
        })),
      steps: steps
        .filter((s) => s.description.trim())
        .map((s, idx) => ({
          stepNumber: idx + 1,
          description: toSentenceCase(s.description.trim()),
          tip: s.tip.trim() ? lowerFirst(s.tip.trim()) : null,
        })),
      imageUrl: newImageKey ?? existingImageUrl,
    }

    const result = await updateRecipeAction(
      recipe.id as number,
      diffRecipeForUpdate(recipe, nextPayload),
    )

    if (result.ok) {
      // Replaced the image: the old one is now orphaned in R2, clean it up.
      if (newImageKey && existingImageUrl) {
        deleteRecipeImageAction(existingImageUrl)
      }
      router.push(`/recipe/${recipe.id}`)
      router.refresh()
    } else {
      if (newImageKey) {
        deleteRecipeImageAction(newImageKey)
      }
      setSubmitError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-sm border-b border-border">
        <Button
          render={<Link href={`/recipe/${recipe.id}`} />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
        </Button>
        <span className="font-heading text-base font-semibold">Edit Recipe</span>
        <Button onClick={handleSubmit} disabled={isSaveBusy} size="sm" className="gap-1.5">
          {isSaveBusy && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
          {saveLabel}
        </Button>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 pt-5 space-y-8">
        {/* Basic Info */}
        <section>
          <SectionHeading>Basic Info</SectionHeading>
          <div className="space-y-4">
            <div id="field-name">
              <FieldLabel required>Name</FieldLabel>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Grandma's Lasagna"
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <FieldLabel>Description</FieldLabel>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of the recipe…"
                rows={3}
                className={textareaClass}
              />
            </div>
            <div>
              <FieldLabel>Author</FieldLabel>
              <Input
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                placeholder="e.g. Nana"
              />
            </div>
          </div>
        </section>

        {/* Details */}
        <section>
          <SectionHeading>Details</SectionHeading>
          <div className="grid grid-cols-2 gap-4">
            <div id="field-preparationTime">
              <FieldLabel required>Prep time (min)</FieldLabel>
              <Input
                type="number"
                min={1}
                value={preparationTime}
                onChange={(e) => setPreparationTime(e.target.value)}
                aria-invalid={!!errors.preparationTime}
              />
              <FieldError message={errors.preparationTime} />
            </div>
            <div>
              <FieldLabel>Cook time (min)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                aria-invalid={!!errors.cookingTime}
              />
              <FieldError message={errors.cookingTime} />
            </div>
            <div>
              <FieldLabel>Servings</FieldLabel>
              <Input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
              />
            </div>
            <div>
              <FieldLabel>Calories (kcal)</FieldLabel>
              <Input
                type="number"
                min={0}
                value={calories}
                onChange={(e) => setCalories(e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* Image */}
        <section id="field-image">
          <SectionHeading>Image</SectionHeading>
          <FieldLabel>Photo</FieldLabel>
          {existingImageUrl && !imageFile && (
            <p className="mb-2 text-xs text-muted-foreground truncate">Current photo attached</p>
          )}
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-input bg-input/20 px-4 py-3 text-sm text-muted-foreground hover:bg-input/40 transition-colors">
              <input
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                className="sr-only"
                disabled={isProcessingImage}
                onChange={async (e) => {
                  const file = e.target.files?.[0]
                  e.target.value = ""
                  if (!file) return

                  setIsProcessingImage(true)
                  const result = await prepareImageFile(file)
                  setIsProcessingImage(false)

                  if ("error" in result) {
                    setImageFile(undefined)
                    setErrors((prev) => ({ ...prev, image: result.error }))
                    return
                  }
                  setImageFile(result.file)
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.image
                    return next
                  })
                }}
              />
              {isProcessingImage ? (
                "Converting photo…"
              ) : imageFile ? (
                <span className="text-foreground font-medium truncate block">{imageFile.name}</span>
              ) : existingImageUrl ? (
                "Tap to replace photo…"
              ) : (
                "Tap to choose a photo…"
              )}
            </label>
            {imageFile && (
              <button
                type="button"
                onClick={() => setImageFile(undefined)}
                className="flex items-center text-muted-foreground hover:text-destructive transition-colors"
                aria-label="Remove image"
              >
                <HugeiconsIcon icon={Delete02Icon} className="size-4" />
              </button>
            )}
          </div>
          <FieldError message={errors.image} />
        </section>

        {/* Cuisine */}
        <section id="field-cuisine">
          <SectionHeading required>Cuisine</SectionHeading>
          <p className="mb-3 text-xs text-muted-foreground">
            {"Can't find yours? Type it and press Enter to add a custom cuisine."}
          </p>
          <CuisinePicker
            selected={selectedCuisine}
            onSelect={setSelectedCuisine}
            onRemove={() => setSelectedCuisine(null)}
            ariaInvalid={!!errors.cuisine}
          />
          <FieldError message={errors.cuisine} />
        </section>

        {/* Tags */}
        <section>
          <SectionHeading>Tags</SectionHeading>
          <p className="mb-3 text-xs text-muted-foreground">
            {"Can't find a match? Type it and press Enter to add a custom tag."}
          </p>
          <TagPicker
            selected={selectedTags}
            onAdd={(tag) => setSelectedTags((prev) => [...prev, tag])}
            onRemove={(tag) => setSelectedTags((prev) => prev.filter((t) => t !== tag))}
          />
        </section>

        {/* Ingredients */}
        <section id="field-ingredients">
          <SectionHeading>
            Ingredients
            {errors.ingredients && (
              <span className="ml-2 text-sm font-normal text-destructive">
                {errors.ingredients}
              </span>
            )}
          </SectionHeading>
          <div className="space-y-3">
            {ingredients.map((ingredient, index) => (
              <div
                key={ingredient.key}
                className="rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Ingredient {index + 1}
                  </span>
                  {ingredients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeIngredient(index)}
                      className="flex items-center text-muted-foreground hover:text-destructive transition-colors"
                      aria-label="Remove ingredient"
                    >
                      <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Input
                    value={ingredient.name}
                    onChange={(e) => handleIngredientNameChange(index, e.target.value)}
                    onBlur={() =>
                      setTimeout(() => updateIngredient(index, { dropdownOpen: false }), 150)
                    }
                    placeholder="Ingredient name"
                  />
                  {ingredient.dropdownOpen && ingredient.searchResults.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-md">
                      {ingredient.searchResults.map((r) => (
                        <button
                          key={r.id}
                          type="button"
                          onMouseDown={() => {
                            updateIngredient(index, {
                              name: r.name,
                              dropdownOpen: false,
                              searchResults: [],
                            })
                          }}
                          className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                        >
                          {r.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <FieldLabel>Quantity</FieldLabel>
                    <Input
                      type="number"
                      min={0}
                      step="any"
                      value={ingredient.quantity ?? ""}
                      onChange={(e) =>
                        updateIngredient(index, {
                          quantity: parseFloat(e.target.value) || 0,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <FieldLabel>Unit</FieldLabel>
                    <select
                      value={ingredient.unitId ?? ""}
                      onChange={(e) =>
                        updateIngredient(index, {
                          unitId: e.target.value ? parseInt(e.target.value) : null,
                        })
                      }
                      className="h-9 w-full rounded-4xl border border-input bg-input/30 px-3 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    >
                      <option value="">—</option>
                      {units.map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.abbreviation})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <FieldLabel>Notes</FieldLabel>
                  <Input
                    value={ingredient.notes}
                    onChange={(e) => updateIngredient(index, { notes: e.target.value })}
                    placeholder="e.g. finely chopped (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addIngredient}
            className="mt-3 gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            Add Ingredient
          </Button>
        </section>

        {/* Steps */}
        <section id="field-steps">
          <SectionHeading>
            Steps
            {errors.steps && (
              <span className="ml-2 text-sm font-normal text-destructive">{errors.steps}</span>
            )}
          </SectionHeading>
          <div className="space-y-3" ref={stepsListRef}>
            {steps.map((step, index) => (
              <div
                key={step.key}
                className="flex gap-3"
                data-step-index={index}
                draggable
                {...dragHandlersFor(index)}
              >
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground mt-2.5">
                  {index + 1}
                </span>
                <div className="flex-1 rounded-xl bg-card px-4 py-3 ring-1 ring-foreground/10 space-y-3">
                  <div className="flex items-start gap-2">
                    <button
                      type="button"
                      data-drag-handle
                      className="mt-1 cursor-grab touch-none text-muted-foreground active:cursor-grabbing"
                      aria-label="Drag to reorder step"
                    >
                      <HugeiconsIcon icon={DragDropVerticalIcon} className="size-4" />
                    </button>
                    <textarea
                      value={step.description}
                      onChange={(e) => updateStep(index, { description: e.target.value })}
                      placeholder="Describe this step…"
                      rows={2}
                      className={`${textareaClass} flex-1`}
                    />
                    {steps.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeStep(index)}
                        className="mt-1 flex items-center text-muted-foreground hover:text-destructive transition-colors"
                        aria-label="Remove step"
                      >
                        <HugeiconsIcon icon={Delete02Icon} className="size-4" />
                      </button>
                    )}
                  </div>
                  <Input
                    value={step.tip}
                    onChange={(e) => updateStep(index, { tip: e.target.value })}
                    placeholder="Tip (optional)"
                  />
                </div>
              </div>
            ))}
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addStep}
            className="mt-3 ml-9 gap-1.5"
          >
            <HugeiconsIcon icon={PlusSignIcon} className="size-4" />
            Add Step
          </Button>
        </section>

        <div className="pt-2 pb-safe">
          {Object.keys(errors).length > 0 && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              <ul className="list-disc list-inside space-y-1">
                {Object.values(errors).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            </div>
          )}
          {submitError && (
            <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {submitError}
            </div>
          )}
          <Button onClick={handleSubmit} disabled={isSaveBusy} className="w-full gap-1.5" size="lg">
            {isSaveBusy && <HugeiconsIcon icon={Loading03Icon} className="size-4 animate-spin" />}
            {saveLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
