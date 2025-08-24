import type React from "react"
import type { Metadata } from "next"
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google"
import "./globals.css"
import { LayoutClient } from "./layout-client"
import { TanstackQueryProvider } from "@/lib/tanstack-query/tanstack-query-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "sonner"

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-sans",
  display: "swap",
})

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-ibm-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Agentic Merdeka - Multi-Modal AI Platform Celebration 17 August 2025",
  description: "Complete AI platform with chat, image generation, vision, TTS, and embeddings"
}

export default function RootLayout({
  children,
}: Readonly < {
  children: React.React.Node
} > ) {
  return (
    <html lang="en" className={`${ibmPlexSans.variable} ${ibmPlexMono.variable} dark`} suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TanstackQueryProvider>
            <LayoutClient />
            {children}
            <Toaster richColors />
          </TanstackQueryProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}