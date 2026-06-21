"use client"

import { useEffect } from "react"
import { Nunito, Inter } from "next/font/google"
import { cn } from "@/lib/utils"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" })
const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

const GlobalError = ({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) => {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className={cn("h-full antialiased font-sans", nunito.variable, inter.variable)}>
      <body className="min-h-full flex items-center justify-center">
        <div className="mx-auto max-w-screen-sm px-4 py-20 text-center">
          <p className="text-6xl font-bold text-destructive">500</p>
          <h1 className="mt-4 font-heading text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            A critical error occurred. Please refresh the page or try again.
          </p>
          <button
            onClick={reset}
            className="mt-8 rounded-lg bg-primary px-6 py-3 text-base font-semibold text-primary-foreground"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}

export default GlobalError
