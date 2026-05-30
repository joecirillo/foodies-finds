import type { Metadata } from "next"
import { Nunito, Inter } from "next/font/google"
import "./globals.css"
import { cn } from "@/lib/utils"
import { Header } from "@/components/Header"
import { Footer } from "@/components/Footer"

const nunito = Nunito({ subsets: ["latin"], variable: "--font-sans" })
const inter = Inter({ subsets: ["latin"], variable: "--font-secondary" })

export const metadata: Metadata = {
  title: "Foodies Finds",
  description: "Track your favorite family recipes",
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
