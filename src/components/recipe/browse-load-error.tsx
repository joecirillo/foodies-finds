"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"

export const BrowseLoadError = () => {
  const router = useRouter()
  const [isRetrying, startRetry] = useTransition()

  const retry = () => startRetry(() => router.refresh())

  return (
    <Card role="alert" className="text-center">
      <CardHeader>
        <CardTitle className="text-lg">We couldn&apos;t load recipes</CardTitle>
        <CardDescription className="text-base">
          Something went wrong on our end. Check your connection and try again.
        </CardDescription>
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
