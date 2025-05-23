import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import type React from "react"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/toaster"
import { TradePositionsProvider } from "@/contexts/TradePositionsContext"
import { LanguageProvider } from "@/contexts/LanguageContext"
import { languages } from "./i18n/settings"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "BitPulse Trading",
  description: "La plataforma de trading más moderna",
  generator: 'v0.dev'
}

export async function generateStaticParams() {
  return languages.map(lng => ({ lng }));
}

interface RootLayoutProps {
  children: React.ReactNode;
  params: { lng?: string };
}

export default function RootLayout({
  children,
  params: { lng = 'es' }
}: RootLayoutProps) {
  return (
    <html lang={lng}>
      <body className={inter.className}>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LanguageProvider initialLocale={lng as 'es' | 'en'}>
            <TradePositionsProvider>
              {children}
              <Toaster />
            </TradePositionsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
