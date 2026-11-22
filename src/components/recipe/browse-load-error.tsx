"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const BrowseLoadError = () => {
  const router = useRouter()
  const [isRetrying, startRetry] = useTransition()
  const [retryCount, setRetryCount] = useState(0)
  const failedRetries = isRetrying ? retryCount - 1 : retryCount

  const retry = () => {
    setRetryCount((count) => count + 1)
    startRetry(() => router.refresh())
  }

  return (
    <Card className="text-center">
      <CardHeader>
        <div role="alert" key={failedRetries} className="grid gap-2">
          <CardTitle className="text-lg">We couldn&apos;t load recipes</CardTitle>
          <CardDescription className="text-base">
            {failedRetries === 0
              ? "Something went wrong on our end. Check your connection and try again."
              : "Still no luck. Give it a moment, then try again."}
          </CardDescription>
        </div>
      </CardHeader>
      <CardFooter className="justify-center">
        <Button
          size="lg"
          className="w-full sm:w-auto sm:min-w-48"
          onClick={retry}
          disabled={isRetrying}
        >
          {isRetrying ? "Retrying…" : "Try again"}
        </Button>
      </CardFooter>
    </Card>
  )
}
