"use client"

import Sidebar from "@/components/Sidebar"
import dynamic from "next/dynamic"
import { MarketSimulator } from "@/components/enhanced-markets/MarketSimulator"

// Dynamically import MarketsNavigation for client-side only rendering
const MarketsNavigation = dynamic(() => import("@/components/MarketsNavigation"), { ssr: false })

export default function MarketsPage() {
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1">
          <MarketsNavigation />
        </main>
        
        <div className="p-4 border-b border-border">
          <MarketSimulator />
        </div>
      </div>
    </div>
  )
} 