"use client"

import { Delete02Icon } from "@hugeicons/core-free-icons"
import { HugeiconsIcon } from "@hugeicons/react"
import Image from "next/image"
import { useState } from "react"

type ExternalImagePreviewProps = {
  src: string
  alt: string
  onRemove: () => void
}

export const ExternalImagePreview = ({ src, alt, onRemove }: ExternalImagePreviewProps) => {
  const [failedSrc, setFailedSrc] = useState<string | null>(null)
  const hasFailed = failedSrc === src

  return (
    <div className="mt-3 flex items-start gap-3">
      <div className="relative aspect-4/3 w-32 shrink-0 overflow-hidden rounded-xl bg-muted">
        {hasFailed ? (
          <p className="flex h-full items-center p-2 text-center text-xs text-muted-foreground">
            {"Couldn't load preview"}
          </p>
        ) : (
          <Image
            src={src}
            alt={alt}
            fill
            unoptimized
            sizes="128px"
            className="object-cover"
            onError={() => setFailedSrc(src)}
          />
        )}
      </div>
      <div className="min-w-0 flex-1 space-y-1 text-xs text-muted-foreground">
        <p className="font-medium text-foreground">Imported photo</p>
        <p>
          {hasFailed
            ? "The photo link will still be saved. Replace or remove it if you prefer."
            : "Saved as a link to the original site."}
        </p>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1 py-1 text-muted-foreground hover:text-destructive transition-colors"
        >
          <HugeiconsIcon icon={Delete02Icon} className="size-4" />
          Remove imported photo
        </button>
      </div>
    </div>
  )
}
