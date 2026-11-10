"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Download04Icon, Loading03Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"

type RecipeImportPanelProps = {
  url: string
  onUrlChange: (url: string) => void
  onImport: () => void
  isLoading: boolean
  error: string | null
}

export const RecipeImportPanel = ({
  url,
  onUrlChange,
  onImport,
  isLoading,
  error,
}: RecipeImportPanelProps) => (
  <section className="rounded-xl bg-card px-4 py-4 ring-1 ring-foreground/10">
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onImport()
      }}
      className="space-y-2"
    >
      <label htmlFor="recipe-import-url" className="block font-heading text-base font-semibold">
        Import from a link
      </label>
      <p className="text-xs text-muted-foreground">
        Paste a recipe page link. Nothing is saved until you review it and tap Save.
      </p>
      <div className="flex gap-2">
        <Input
          id="recipe-import-url"
          type="url"
          inputMode="url"
          autoCapitalize="off"
          autoCorrect="off"
          autoComplete="off"
          enterKeyHint="go"
          placeholder="https://…"
          value={url}
          onChange={(e) => onUrlChange(e.target.value)}
          aria-invalid={!!error}
          aria-describedby={error ? "recipe-import-error" : undefined}
          className="min-w-0 flex-1"
        />
        <Button type="submit" disabled={isLoading} className="shrink-0 gap-1.5">
          <HugeiconsIcon
            icon={isLoading ? Loading03Icon : Download04Icon}
            className={isLoading ? "size-4 animate-spin" : "size-4"}
          />
          {isLoading ? "Importing…" : "Import"}
        </Button>
      </div>
      <p role="status" aria-live="polite" className="sr-only">
        {isLoading ? "Importing recipe…" : ""}
      </p>
      {error && (
        <p id="recipe-import-error" role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </form>
  </section>
)
