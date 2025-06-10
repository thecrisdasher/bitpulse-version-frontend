"use client"

import { useState } from "react"
import dynamic from "next/dynamic"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent } from "@/components/ui/card"
import { MarketInstrument } from "@/lib/mockData"
import { MarketSimulator } from "@/components/enhanced-markets/MarketSimulator"

// Dynamically import components with client-side only rendering
const MarketsNavigation = dynamic(() => import("@/components/MarketsNavigation"), { ssr: false })
const TradeControlPanel = dynamic(() => import("@/components/TradeControlPanel"), { ssr: false })

export default function MarketsPage() {
  const [selectedInstrument, setSelectedInstrument] = useState<MarketInstrument | null>(null)
  const [showTradePanel, setShowTradePanel] = useState(false)

  const handleInstrumentSelect = (instrument: MarketInstrument) => {
    setSelectedInstrument(instrument)
    setShowTradePanel(true)
  }

  const closeTradePanel = () => {
    setShowTradePanel(false)
  }

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <main className="flex-1 flex">
          <div className={`flex-1 transition-all duration-300 ${showTradePanel ? 'max-w-[calc(100%-350px)]' : 'w-full'}`}>
            <MarketsNavigation onInstrumentSelect={handleInstrumentSelect} />
          </div>
          
          {showTradePanel && selectedInstrument && (
            <div className="w-[350px] border-l border-border p-4 transition-all duration-300 ease-in-out">
              <TradeControlPanel
                marketId={selectedInstrument.id}
                marketName={selectedInstrument.name}
                marketPrice={selectedInstrument.price}
                marketColor={selectedInstrument.color || ''}
                isVisible={showTradePanel}
                onClose={closeTradePanel}
              />
            </div>
          )}
        </main>
        
        <div className="p-4 border-b border-border">
          <MarketSimulator />
        </div>
      </div>
    </div>
  )
} 