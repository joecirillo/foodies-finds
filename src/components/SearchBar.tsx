"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Input } from "@/components/ui/input"
import { useRecipeSearch } from "@/hooks/useRecipeSearch"

type SearchBarProps = {
  className?: string
  placeholder?: string
}

export const SearchBar = ({ className, placeholder = "Search for recipes..." }: SearchBarProps) => {
  const { query, setQuery, results, loading } = useRecipeSearch()
  const containerRef = useRef<HTMLDivElement>(null)
  const hasResults = results.length > 0
  const showDropdown = query.length >= 2 && (loading || hasResults)
  const showEmpty = query.length >= 2 && !loading && !hasResults

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setQuery("")
      }
    }
    document.addEventListener("mousedown", handleMouseDown)
    return () => document.removeEventListener("mousedown", handleMouseDown)
  }, [setQuery])

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") setQuery("")
  }

  return (
    <div ref={containerRef} className="relative w-full">
      <Input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
      />
      {(showDropdown || showEmpty) && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 overflow-hidden rounded-md border border-border bg-background text-foreground shadow-lg">
          {loading && !hasResults && (
            <div className="px-4 py-3 text-sm text-muted-foreground">Searching…</div>
          )}
          {showEmpty && (
            <div className="px-4 py-3 text-sm text-muted-foreground">No recipes found</div>
          )}
          {results.map((result) => (
            <Link
              key={result.id}
              href={`/recipe/${result.id}`}
              onClick={() => setQuery("")}
              className="block px-4 py-3 text-sm hover:bg-muted"
            >
              {result.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
