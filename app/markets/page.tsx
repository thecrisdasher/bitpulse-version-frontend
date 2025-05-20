"use client"

import { Suspense } from "react"
import Sidebar from "@/components/Sidebar"
import MarketsNavigation from "@/components/MarketsNavigation"
import { MarketSkeleton } from "@/components/MarketSkeleton"

export default function MarketsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Suspense fallback={<MarketSkeleton />}>
          <MarketsNavigation />
        </Suspense>
      </div>
    </div>
  )
} 