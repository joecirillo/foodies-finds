"use client"

import { Input } from "@/components/ui/input"
import { useEntitySearch } from "@/hooks/useEntitySearch"
import type { EntityOption } from "@/types/recipe"
import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type TagPickerProps = {
  selected: EntityOption[]
  onAdd: (tag: EntityOption) => void
  onRemove: (tag: EntityOption) => void
}

const normalizeTagName = (name: string) => name.trim().replace(/\s+/g, "-")

export const TagPicker = ({ selected, onAdd, onRemove }: TagPickerProps) => {
  const { query, setQuery, results, open, setOpen } = useEntitySearch("/api/search/tags")

  const isSelected = (name: string) =>
    selected.some((t) => t.name.toLowerCase() === name.toLowerCase())

  const trimmed = query.trim()
  const normalized = normalizeTagName(query)
  const visibleResults = results.filter((t) => !selected.some((s) => s.id === t.id))
  const hasExactMatch = results.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())

  const createTag = () => {
    if (!normalized || isSelected(normalized)) return
    onAdd({ id: null, name: normalized })
    setQuery("")
    setOpen(false)
  }

  return (
    <div>
      {selected.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-2">
          {selected.map((tag) => (
            <span
              key={tag.id ?? tag.name}
              className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground"
            >
              {tag.name}
              <button
                type="button"
                onClick={() => onRemove(tag)}
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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && trimmed) {
              e.preventDefault()
              createTag()
            }
          }}
          placeholder="Search tags…"
        />
        {open && (visibleResults.length > 0 || trimmed) && (
          <div className="absolute left-0 right-0 top-full z-20 mt-1 max-h-48 overflow-y-auto rounded-xl border border-border bg-popover shadow-md">
            {visibleResults.map((t) => (
              <button
                key={t.id}
                type="button"
                onMouseDown={() => {
                  onAdd(t)
                  setQuery("")
                  setOpen(false)
                }}
                className="w-full px-4 py-2.5 text-left text-sm hover:bg-muted"
              >
                {t.name}
              </button>
            ))}
            {trimmed && !hasExactMatch && !isSelected(trimmed) && (
              <button
                type="button"
                onMouseDown={createTag}
                className="w-full px-4 py-2.5 text-left text-sm text-primary hover:bg-muted"
              >
                Create &ldquo;{trimmed}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
