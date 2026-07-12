"use client"

import {
  addRecipeAction,
  deleteRecipeImageAction,
  uploadRecipeImageAction,
} from "@/app/actions/recipe"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { lowerFirst, toSentenceCase } from "@/lib/utils/text"
import type { IngredientRow, StepRow, Unit } from "@/types/recipe"
import { ArrowLeft02Icon, Delete02Icon, DragDropVerticalIcon, PlusSignIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useRef, useState } from "react"

type SearchResult = { id: number; name: string }
type SearchResultOption = { id: number | null; name: string }

const SectionHeading = ({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) => (
  <h2 className="font-heading text-lg font-semibold mb-3">
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </h2>
)

const FieldLabel = ({ children, required }: { children: React.ReactNode; required?: boolean }) => (
  <label className="block text-sm font-medium text-foreground mb-1.5">
    {children}
    {required && <span className="text-destructive ml-0.5">*</span>}
  </label>
)

const FieldError = ({ message }: { message?: string }) =>
  message ? <p className="mt-1 text-xs text-destructive">{message}</p> : null

const textareaClass =
  "w-full min-w-0 rounded-xl border border-input bg-input/30 px-3 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:pointer-events-none disabled:opacity-50 resize-none"

export const RecipeForm = () => {
  const router = useRouter()
  const keyCounter = useRef(1)
  const nextKey = () => ++keyCounter.current
  const dragIndex = useRef<number | null>(null)
  const stepsListRef = useRef<HTMLDivElement>(null)

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [author, setAuthor] = useState("")
  const [imageFile, setImageFile] = useState<File | undefined>(undefined)
  const [preparationTime, setPreparationTime] = useState("")
  const [cookingTime, setCookingTime] = useState("")
  const [servings, setServings] = useState("")
  const [calories, setCalories] = useState("")

  const [cuisineQuery, setCuisineQuery] = useState("")
  const [cuisineResults, setCuisineResults] = useState<SearchResult[]>([])
  const [cuisineDropdownOpen, setCuisineDropdownOpen] = useState(false)
  const [selectedCuisine, setSelectedCuisine] = useState<SearchResultOption | null>(null)

  const [tagQuery, setTagQuery] = useState("")
  const [tagResults, setTagResults] = useState<SearchResult[]>([])
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false)
  const [selectedTags, setSelectedTags] = useState<SearchResultOption[]>([])

  const [ingredients, setIngredients] = useState<IngredientRow[]>([
    {
      key: 0,
      name: "",
      unitId: null,
      quantity: 1,
      notes: "",
      searchResults: [],
      dropdownOpen: false,
    },
  ])

  const [steps, setSteps] = useState<StepRow[]>([{ key: 0, description: "", tip: "" }])

  const [units, setUnits] = useState<Unit[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  useEffect(() => {
    fetch("/api/units")
      .then((r) => r.json())
      .then((data: Unit[]) => setUnits(data))
      .catch(() => {})
  }, [])

  const debounce = (key: string, fn: () => void, delay = 300) => {
    if (debounceTimers.current[key]) clearTimeout(debounceTimers.current[key])
    debounceTimers.current[key] = setTimeout(fn, delay)
  }

  const handleCuisineQuery = (q: string) => {
    setCuisineQuery(q)
    if (!q.trim()) {
      setCuisineResults([])
      setCuisineDropdownOpen(false)
      return
    }
    debounce("cuisine", async () => {
      const res = await fetch(`/api/search/cuisines?query=${encodeURIComponent(q)}`)
      const data: SearchResult[] = await res.json()
      setCuisineResults(data)
      setCuisineDropdownOpen(true)
    })
  }

  const handleTagQuery = (q: string) => {
    setTagQuery(q)
    if (!q.trim()) {
      setTagResults([])
      setTagDropdownOpen(false)
      return
    }
    debounce("tag", async () => {
      const res = await fetch(`/api/search/tags?query=${encodeURIComponent(q)}`)
      const data: SearchResult[] = await res.json()
      setTagResults(data)
      setTagDropdownOpen(true)
    })
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
        quantity: 1,
        notes: "",
        searchResults: [],
        dropdownOpen: false,
      },
    ])
  }

  const removeIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index))
  }

  const addStep = () => {
    setSteps((prev) => [...prev, { key: nextKey(), description: "", tip: "" }])
  }

  const removeStep = (index: number) => {
    setSteps((prev) => prev.filter((_, i) => i !== index))
  }

  const reorderStep = useCallback((fromIndex: number, toIndex: number) => {
    setSteps((prev) => {
      const next = [...prev]
      const [moved] = next.splice(fromIndex, 1)
      next.splice(toIndex, 0, moved)
      return next
    })
  }, [])

  useEffect(() => {
    const container = stepsListRef.current
    if (!container) return

    let fromIndex: number | null = null
    let toIndex: number | null = null

    const onTouchStart = (e: TouchEvent) => {
      const handle = (e.target as HTMLElement).closest("[data-drag-handle]")
      if (!handle) return
      const row = handle.closest("[data-step-index]") as HTMLElement | null
      if (row?.dataset.stepIndex !== undefined) {
        fromIndex = parseInt(row.dataset.stepIndex)
        toIndex = fromIndex
      }
    }

    const onTouchMove = (e: TouchEvent) => {
      if (fromIndex === null) return
      e.preventDefault()
      const touch = e.touches[0]
      const el = document.elementFromPoint(touch.clientX, touch.clientY)
      const row = el?.closest("[data-step-index]") as HTMLElement | null
      if (row?.dataset.stepIndex !== undefined) {
        toIndex = parseInt(row.dataset.stepIndex)
      }
    }

    const onTouchEnd = () => {
      if (fromIndex !== null && toIndex !== null && fromIndex !== toIndex) {
        reorderStep(fromIndex, toIndex)
      }
      fromIndex = null
      toIndex = null
    }

    container.addEventListener("touchstart", onTouchStart, { passive: true })
    container.addEventListener("touchmove", onTouchMove, { passive: false })
    container.addEventListener("touchend", onTouchEnd, { passive: true })

    return () => {
      container.removeEventListener("touchstart", onTouchStart)
      container.removeEventListener("touchmove", onTouchMove)
      container.removeEventListener("touchend", onTouchEnd)
    }
  }, [reorderStep])

  const updateStep = (index: number, updates: Partial<StepRow>) => {
    setSteps((prev) => prev.map((row, i) => (i === index ? { ...row, ...updates } : row)))
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

    const servingsNum = parseInt(servings)
    if (!servings || isNaN(servingsNum) || servingsNum < 1)
      newErrors.servings = "Servings is required"

    if (!selectedCuisine) newErrors.cuisine = "Cuisine is required"

    const validIngredients = ingredients.filter(
      (i) => i.name.trim() && i.quantity !== null && i.quantity > 0,
    )
    if (validIngredients.length === 0)
      newErrors.ingredients = "At least one ingredient with a name and quantity is required"

    ingredients.forEach((ing, i) => {
      if (ing.name.trim() && ing.unitId === null)
        newErrors[`ingredient-${i}-unit`] = "Unit is required for " + ing.name.trim()
    })

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

    let uploadedImageUrl: string | null = null

    if (imageFile) {
      const fd = new FormData()
      fd.append("file", imageFile)
      const upload = await uploadRecipeImageAction(fd)
      if (!upload.ok) {
        setErrors((prev) => ({ ...prev, image: upload.error }))
        setIsSubmitting(false)
        return
      }
      uploadedImageUrl = upload.imageUrl
    }

    const result = await addRecipeAction({
      name: name.trim(),
      description: description.trim() || null,
      calories: calories ? parseInt(calories) : null,
      servings: servings ? parseInt(servings) : null,
      cookingTime: cookingTime ? parseInt(cookingTime) : 0,
      preparationTime: parseInt(preparationTime),
      cuisine: selectedCuisine,
      tags: selectedTags.map((tag) => ({ ...tag, name: tag.name.trim().replace(/\s+/g, "-") })),
      author: author.trim() || "Anonymous",
      ingredients: ingredients
        .filter((i) => i.name.trim() && i.quantity !== null && i.quantity > 0)
        .map((i) => ({
          id: null,
          name: i.name.trim().toLowerCase(),
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
      imageUrl: uploadedImageUrl,
    })

    if (result.ok) {
      router.push(`/recipe/${result.id}`)
    } else {
      if (uploadedImageUrl) {
        deleteRecipeImageAction(uploadedImageUrl)
      }
      setSubmitError(result.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background pb-10">
      <div className="sticky top-0 z-10 flex items-center justify-between bg-background/90 px-4 py-3 backdrop-blur-sm border-b border-border">
        <Button
          render={<Link href="/recipe" />}
          nativeButton={false}
          variant="ghost"
          size="icon-sm"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-5" />
        </Button>
        <Button onClick={handleSubmit} disabled={isSubmitting} size="sm" className="gap-1.5">
          {isSubmitting ? "Saving…" : "Save Recipe"}
        </Button>
      </div>

      <div className="mx-auto max-w-screen-sm px-4 pt-5 space-y-8">
        {/* Basic Info */}
        <section>
          <SectionHeading>Basic Info</SectionHeading>
          <p className="mb-4 text-xs text-muted-foreground">
            <span className="text-destructive">*</span> Required field
          </p>
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
            <div id="field-servings">
              <FieldLabel required>Servings</FieldLabel>
              <Input
                type="number"
                min={1}
                value={servings}
                onChange={(e) => setServings(e.target.value)}
                aria-invalid={!!errors.servings}
              />
              <FieldError message={errors.servings} />
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
          <div className="flex items-center gap-3">
            <label className="flex-1 cursor-pointer rounded-xl border border-dashed border-input bg-input/20 px-4 py-3 text-sm text-muted-foreground hover:bg-input/40 transition-colors">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={(e) => {
                  setImageFile(e.target.files?.[0])
                  setErrors((prev) => {
                    const next = { ...prev }
                    delete next.image
                    return next
                  })
                }}
              />
              {imageFile ? (
                <span className="text-foreground font-medium truncate block">{imageFile.name}</span>
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
          {selectedCuisine ? (
            <div className="flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
                {selectedCuisine.name}
                <button
                  type="button"
                  onClick={() => {
                    setSelectedCuisine(null)
                    setCuisineQuery("")
                  }}
                  className="flex items-center text-primary/70 hover:text-primary"
                  aria-label="Remove cuisine"
                >
                  <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                </button>
              </span>
            </div>
          ) : (
            <div className="relative">
              <Input
                value={cuisineQuery}
                onChange={(e) => handleCuisineQuery(e.target.value)}
                onBlur={() => setTimeout(() => setCuisineDropdownOpen(false), 150)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && cuisineQuery.trim()) {
                    e.preventDefault()
                    setSelectedCuisine({ id: null, name: cuisineQuery.trim() })
                    setCuisineQuery("")
                    setCuisineDropdownOpen(false)
                  }
                }}
                placeholder="Search cuisines…"
                aria-invalid={!!errors.cuisine}
              />
              {cuisineDropdownOpen && (cuisineResults.length > 0 || cuisineQuery.trim()) && (
                <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-md">
                  {cuisineResults.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedCuisine(c)
                        setCuisineQuery("")
                        setCuisineDropdownOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      {c.name}
                    </button>
                  ))}
                  {cuisineQuery.trim() &&
                    !cuisineResults.some(
                      (c) => c.name.toLowerCase() === cuisineQuery.trim().toLowerCase(),
                    ) && (
                      <button
                        type="button"
                        onMouseDown={() => {
                          setSelectedCuisine({ id: null, name: cuisineQuery.trim() })
                          setCuisineQuery("")
                          setCuisineDropdownOpen(false)
                        }}
                        className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-muted"
                      >
                        Create &ldquo;{cuisineQuery.trim()}&rdquo;
                      </button>
                    )}
                </div>
              )}
            </div>
          )}
          <FieldError message={errors.cuisine} />
        </section>

        {/* Tags */}
        <section>
          <SectionHeading>Tags</SectionHeading>
          <p className="mb-3 text-xs text-muted-foreground">
            {"Can't find a match? Type it and press Enter to add a custom tag."}
          </p>
          {selectedTags.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id ?? tag.name}
                  className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
                >
                  {tag.name}
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedTags((prev) =>
                        prev.filter((t) => t.id !== tag.id || t.name !== tag.name),
                      )
                    }
                    className="flex items-center text-secondary-foreground/70 hover:text-secondary-foreground"
                    aria-label={`Remove tag ${tag.name}`}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
                  </button>
                </span>
              ))}
            </div>
          )}
          <div className="relative">
            <Input
              value={tagQuery}
              onChange={(e) => handleTagQuery(e.target.value)}
              onBlur={() => setTimeout(() => setTagDropdownOpen(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && tagQuery.trim()) {
                  e.preventDefault()
                  const normalized = tagQuery.trim().replace(/\s+/g, "-")
                  if (!selectedTags.some((t) => t.name.toLowerCase() === normalized.toLowerCase())) {
                    setSelectedTags((prev) => [...prev, { id: null, name: normalized }])
                  }
                  setTagQuery("")
                  setTagDropdownOpen(false)
                }
              }}
              placeholder="Search tags…"
            />
            {tagDropdownOpen && (tagResults.length > 0 || tagQuery.trim()) && (
              <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-md">
                {tagResults
                  .filter((t) => !selectedTags.some((s) => s.id === t.id))
                  .map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onMouseDown={() => {
                        setSelectedTags((prev) => [...prev, t])
                        setTagQuery("")
                        setTagDropdownOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
                    >
                      {t.name}
                    </button>
                  ))}
                {tagQuery.trim() &&
                  !tagResults.some((t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase()) &&
                  !selectedTags.some(
                    (t) => t.name.toLowerCase() === tagQuery.trim().toLowerCase(),
                  ) && (
                    <button
                      type="button"
                      onMouseDown={() => {
                        const normalized = tagQuery.trim().replace(/\s+/g, "-")
                        setSelectedTags((prev) => [...prev, { id: null, name: normalized }])
                        setTagQuery("")
                        setTagDropdownOpen(false)
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-muted"
                    >
                      Create &ldquo;{tagQuery.trim()}&rdquo;
                    </button>
                  )}
              </div>
            )}
          </div>
        </section>

        {/* Ingredients */}
        <section id="field-ingredients">
          <SectionHeading required>
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
                          quantity: parseFloat(e.target.value) || null,
                        })
                      }
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <FieldLabel required>Unit</FieldLabel>
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
                    <FieldError message={errors[`ingredient-${index}-unit`]} />
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
          <SectionHeading required>
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
                onDragStart={() => { dragIndex.current = index }}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragIndex.current !== null && dragIndex.current !== index) {
                    reorderStep(dragIndex.current, index)
                  }
                  dragIndex.current = null
                }}
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
          <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full" size="lg">
            {isSubmitting ? "Saving…" : "Save Recipe"}
          </Button>
        </div>
      </div>
    </div>
  )
}
