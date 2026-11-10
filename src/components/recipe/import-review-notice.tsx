import { AlertCircleIcon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import { sourceHostname } from "@/lib/recipe-import/source-hostname"
import type { RecipeImportContext } from "@/types/recipe"

const YIELD_WARNING_CODES = new Set(["AMBIGUOUS_YIELD", "UNSUPPORTED_YIELD"])

export const ImportReviewNotice = ({ source, warnings }: RecipeImportContext) => {
  const showOriginalYield =
    !!source.originalYield && warnings.some((warning) => YIELD_WARNING_CODES.has(warning.code))

  return (
    <section
      role="status"
      className="space-y-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm"
    >
      <p className="font-medium text-foreground">
        Imported from {sourceHostname(source.sourceUrl)} — review before saving
      </p>
      {warnings.length > 0 && (
        <ul className="space-y-1.5" aria-label="Import warnings">
          {warnings.map((warning, index) => (
            <li key={`${warning.code}-${index}`} className="flex gap-2 text-muted-foreground">
              <HugeiconsIcon icon={AlertCircleIcon} className="mt-0.5 size-4 shrink-0" />
              <span>{warning.message}</span>
            </li>
          ))}
        </ul>
      )}
      {showOriginalYield && (
        <p className="text-muted-foreground">
          Original yield:{" "}
          <span className="whitespace-pre-line text-foreground">{source.originalYield}</span>
        </p>
      )}
      {source.originalIngredientLines.length > 0 && (
        <details className="text-muted-foreground">
          <summary className="cursor-pointer py-1 font-medium text-foreground">
            Original ingredient lines ({source.originalIngredientLines.length})
          </summary>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {source.originalIngredientLines.map((line, index) => (
              <li key={index}>{line}</li>
            ))}
          </ul>
        </details>
      )}
    </section>
  )
}
