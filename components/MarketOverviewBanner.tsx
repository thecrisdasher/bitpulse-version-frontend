"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"

const MarketOverviewBanner = ({ liveUpdates }) => {
  const [marketData, setMarketData] = useState({
    totalMarketCap: 1.23,
    volume24h: 78.9,
    btcDominance: 46.2,
  })

  useEffect(() => {
    if (liveUpdates) {
      const interval = setInterval(() => {
        setMarketData((prevData) => ({
          totalMarketCap: prevData.totalMarketCap * (1 + (Math.random() * 0.02 - 0.01)),
          volume24h: prevData.volume24h * (1 + (Math.random() * 0.02 - 0.01)),
          btcDominance: prevData.btcDominance + (Math.random() * 0.4 - 0.2),
        }))
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [liveUpdates])

  return (
    <Card className="mb-4">
      <CardContent className="py-2">
        <div className="flex justify-between items-center">
          <div className="text-sm">
            <span className="font-semibold">Total Market Cap:</span> ${marketData.totalMarketCap.toFixed(2)}T
          </div>
          <div className="text-sm">
            <span className="font-semibold">24h Volume:</span> ${marketData.volume24h.toFixed(1)}B
          </div>
          <div className="text-sm">
            <span className="font-semibold">BTC Dominance:</span> {marketData.btcDominance.toFixed(1)}%
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketOverviewBanner
