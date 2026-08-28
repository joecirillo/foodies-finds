"use client"

import { useEffect, useState } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { HugeiconsIcon } from "@hugeicons/react"
import { Cancel01Icon } from "@hugeicons/core-free-icons"
import { buttonVariants } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { cn } from "@/lib/utils"

type FilterOption = { id: number; name: string }
type FilterKey = "cuisine" | "tag" | "ingredient"

const LABELS: Record<FilterKey, string> = {
  cuisine: "Cuisine",
  tag: "Tag",
  ingredient: "Ingredient",
}

const ENDPOINTS: Record<FilterKey, string> = {
  cuisine: "/api/search/cuisines",
  tag: "/api/search/tags",
  ingredient: "/api/search/ingredients",
}

const ID_PARAMS: Record<FilterKey, string> = {
  cuisine: "cuisineId",
  tag: "tagId",
  ingredient: "ingredientId",
}

const NAME_PARAMS: Record<FilterKey, string> = {
  cuisine: "cuisineName",
  tag: "tagName",
  ingredient: "ingredientName",
}

type FilterPillProps = {
  filterKey: FilterKey
  selectedId: number | null
  selectedName: string | null
  onSelect: (option: FilterOption) => void
  onClear: () => void
}

const FilterPill = ({
  filterKey,
  selectedId,
  selectedName,
  onSelect,
  onClear,
}: FilterPillProps) => {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [results, setResults] = useState<FilterOption[]>([])
  const [searchFailed, setSearchFailed] = useState(false)

  useEffect(() => {
    if (!open) return

    const delay = query === "" ? 0 : 300
    const timer = setTimeout(() => {
      fetch(`${ENDPOINTS[filterKey]}?query=${encodeURIComponent(query)}`)
        .then((res) => {
          if (!res.ok) throw new Error(`Search failed (${res.status})`)
          return res.json()
        })
        .then((data) => {
          setSearchFailed(false)
          setResults(data)
        })
        .catch(() => {
          setSearchFailed(true)
          setResults([])
        })
    }, delay)
    return () => clearTimeout(timer)
  }, [query, open, filterKey])

  const isActive = selectedId !== null

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className={cn(
          buttonVariants({ variant: isActive ? "default" : "outline", size: "sm" }),
          "shrink-0",
        )}
      >
        {isActive ? (
          <>
            <span>{selectedName}</span>
            <span
              role="button"
              aria-label={`Clear ${LABELS[filterKey]} filter`}
              className="-mr-0.5 ml-1 flex items-center"
              onClick={(e) => {
                e.stopPropagation()
                onClear()
              }}
            >
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-3.5" />
            </span>
          </>
        ) : (
          LABELS[filterKey]
        )}
      </PopoverTrigger>
      <PopoverContent className="w-56 p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder={`Search ${LABELS[filterKey]}...`}
            value={query}
            onValueChange={setQuery}
          />
          <CommandList>
            <CommandEmpty>
              {searchFailed ? "Search failed. Please try again." : "No results found."}
            </CommandEmpty>
            <CommandGroup>
              {results.map((item) => (
                <CommandItem
                  key={`${filterKey}-${item.id}`}
                  value={String(item.id)}
                  data-checked={selectedId === item.id}
                  onSelect={() => {
                    onSelect(item)
                    setOpen(false)
                  }}
                >
                  {item.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

export const BrowseFilters = () => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const getSelected = (key: FilterKey): { id: number; name: string } | null => {
    const id = searchParams.get(ID_PARAMS[key])
    const name = searchParams.get(NAME_PARAMS[key])
    if (id && name) return { id: Number(id), name }
    return null
  }

  const handleSelect = (key: FilterKey, option: FilterOption) => {
    const params = new URLSearchParams(searchParams.toString())
    params.set(ID_PARAMS[key], String(option.id))
    params.set(NAME_PARAMS[key], option.name)
    router.replace(`${pathname}?${params.toString()}`)
  }

  const handleClear = (key: FilterKey) => {
    const params = new URLSearchParams(searchParams.toString())
    params.delete(ID_PARAMS[key])
    params.delete(NAME_PARAMS[key])
    router.replace(`${pathname}?${params.toString()}`)
  }

  const keys: FilterKey[] = ["cuisine", "tag", "ingredient"]

  return (
    <div className="flex gap-2 overflow-x-auto pb-2">
      {keys.map((key) => {
        const selected = getSelected(key)
        return (
          <FilterPill
            key={key}
            filterKey={key}
            selectedId={selected?.id ?? null}
            selectedName={selected?.name ?? null}
            onSelect={(option) => handleSelect(key, option)}
            onClear={() => handleClear(key)}
          />
        )
      })}
    </div>
  )
}
