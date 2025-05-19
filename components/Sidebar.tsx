"use client"

import { Home, TrendingUp, BarChart2, PlusCircle, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cryptocurrencies } from "@/lib/mockData"
import { useState, useEffect } from "react"
import CurrencyConverterModal from "./CurrencyConverterModal"
import PortfolioModal from "./PortfolioModal"

const Sidebar = () => {
  return (
    <div className="w-64 bg-card h-screen p-4 hidden lg:block border-r border-border">
      <h2 className="text-2xl font-bold mb-6 text-primary">CryptoTracker</h2>
      <nav>
        <ul className="space-y-2">
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <Home className="mr-2 h-4 w-4" />
              Dashboard
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <TrendingUp className="mr-2 h-4 w-4" />
              Trending
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <BarChart2 className="mr-2 h-4 w-4" />
              Market
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <PlusCircle className="mr-2 h-4 w-4" />
              New Listings
            </Button>
          </li>
          <li>
            <Button variant="ghost" className="w-full justify-start">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
          </li>
        </ul>
      </nav>
      <div className="mt-4">
        <CurrencyConverterModal />
      </div>
      <PortfolioSummary />
    </div>
  )
}

const PortfolioSummary = () => {
  const [totalValue, setTotalValue] = useState(0)

  useEffect(() => {
    // This is a mock calculation. In a real app, this would be based on actual user data.
    const mockPortfolio = [
      { symbol: "BTC", amount: 0.5 },
      { symbol: "ETH", amount: 5 },
      { symbol: "ADA", amount: 1000 },
    ]

    const calculatedValue = mockPortfolio.reduce((sum, asset) => {
      const crypto = cryptocurrencies.find((c) => c.symbol === asset.symbol)
      return sum + (crypto ? crypto.price * asset.amount : 0)
    }, 0)

    setTotalValue(calculatedValue)
  }, [])

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">Portfolio Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <PortfolioModal />
      </CardContent>
    </Card>
  )
}

export default Sidebar
