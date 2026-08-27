"use client"

import { Input } from "@/components/ui/input"
import { useEntitySearch } from "@/hooks/useEntitySearch"
import { toTitleCase } from "@/lib/utils/text"
import type { EntityOption } from "@/types/recipe"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type CuisinePickerProps = {
  selected: EntityOption | null
  onSelect: (cuisine: EntityOption) => void
  onRemove: () => void
  ariaInvalid?: boolean
}

export const CuisinePicker = ({ selected, onSelect, onRemove, ariaInvalid }: CuisinePickerProps) => {
  const { query, setQuery, results, open, setOpen } = useEntitySearch("/api/search/cuisines")

  if (selected) {
    return (
      <div className="flex flex-wrap gap-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
          {selected.name}
          <button
            type="button"
            onClick={onRemove}
            className="flex items-center text-primary/70 hover:text-primary"
            aria-label="Remove cuisine"
          >
            <HugeiconsIcon icon={Delete02Icon} className="size-3.5" />
          </button>
        </span>
      </div>
    )
  }

  const trimmed = query.trim()
  const hasExactMatch = results.some((c) => c.name.toLowerCase() === trimmed.toLowerCase())

  const createCuisine = () => {
    onSelect({ id: null, name: toTitleCase(trimmed) })
    setQuery("")
    setOpen(false)
  }

  return (
    <div className="relative">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && trimmed) {
            e.preventDefault()
            createCuisine()
          }
        }}
        placeholder="Search cuisines…"
        aria-invalid={ariaInvalid}
      />
      {open && (results.length > 0 || trimmed) && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-md">
          {results.map((c) => (
            <button
              key={c.id}
              type="button"
              onMouseDown={() => {
                onSelect(c)
                setQuery("")
                setOpen(false)
              }}
              className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
            >
              {c.name}
            </button>
          ))}
          {trimmed && !hasExactMatch && (
            <button
              type="button"
              onMouseDown={createCuisine}
              className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-muted"
            >
              Create &ldquo;{trimmed}&rdquo;
            </button>
          )}
        </div>
      )}
    </div>
  )
}
