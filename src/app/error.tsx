"use client"

import Link from "next/link"
import { useEffect } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons"
import { Button } from "@/components/ui/button"

const ErrorPage = ({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="mx-auto max-w-screen-sm px-4 py-20 text-center">
      <p className="text-6xl font-bold text-destructive">500</p>
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        Something went wrong
      </h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground">
        An unexpected error occurred. You can try again or head back home.
      </p>
      <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
        <Button size="lg" onClick={reset}>
          Try again
        </Button>
        <Button
          render={<Link href="/" />}
          nativeButton={false}
          variant="outline"
          size="lg"
          className="gap-2"
        >
          <HugeiconsIcon icon={ArrowLeft02Icon} className="size-4" />
          Back to Home
        </Button>
      </div>
    </div>
  )
}

export default ErrorPage
