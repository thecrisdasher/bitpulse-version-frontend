"use client"

import { Suspense } from "react"
import Sidebar from "@/components/Sidebar"
import dynamic from "next/dynamic"
import { MarketSkeleton } from "@/components/SkeletonLoaders"

// Importar MarketsNavigation con SSR desactivado
const MarketsNavigation = dynamic(
  () => import("@/components/MarketsNavigation"),
  { 
    ssr: false,
    loading: () => <MarketSkeleton />
  }
);

export default function MarketsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <MarketsNavigation />
      </div>
    </div>
  )
} 