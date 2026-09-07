import type { Metadata } from "next"
import { Nunito, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { getSiteUrl } from "@/lib/site-url"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" })
const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

const title = "Foodies Finds"
const description = "Track your favorite family recipes"

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title,
  description,
  openGraph: {
    title,
    description,
    images: ["/no-image.jpeg"],
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={cn("h-full antialiased font-sans", nunito.variable, inter.variable)}>
      <body className="min-h-full flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  )
}
