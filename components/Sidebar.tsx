"use client"

import { Home, TrendingUp, BarChart2, PlusCircle, Settings, Wallet, HelpCircle, CandlestickChart, LineChart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cryptocurrencies } from "@/lib/mockData"
import { useState, useEffect } from "react"
import CurrencyConverterModal from "./CurrencyConverterModal"
import PortfolioModal from "./PortfolioModal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

const Sidebar = () => {
  const pathname = usePathname();

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">BitPulse</h1>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2 space-y-1">
          <li>
            <Link 
              href="/" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Home size={18} />
              Dashboard
            </Link>
          </li>
          <li>
            <Link 
              href="/markets" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/markets" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <CandlestickChart size={18} />
              Mercados
            </Link>
          </li>
          <li>
            <Link 
              href="/trending" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/trending" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <LineChart size={18} />
              Trending
            </Link>
          </li>
          <li>
            <Link 
              href="/portfolio" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/portfolio" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Wallet size={18} />
              Portfolio
            </Link>
          </li>
          <li>
            <Link 
              href="/statistics" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/statistics" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <BarChart2 size={18} />
              Statistics
            </Link>
          </li>
        </ul>
      </nav>
      <div className="p-4 border-t border-border">
        <ul className="space-y-1">
          <li>
            <Link 
              href="/settings" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/settings" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Settings size={18} />
              Settings
            </Link>
          </li>
          <li>
            <Link 
              href="/help" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/help" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <HelpCircle size={18} />
              Help & Support
            </Link>
          </li>
        </ul>
      </div>
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
