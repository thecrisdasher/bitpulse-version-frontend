"use client"

import { Home, TrendingUp, BarChart2, PlusCircle, Settings, Wallet, HelpCircle, CandlestickChart, LineChart, MessageSquare, BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cryptocurrencies } from "@/lib/mockData"
import { useState, useEffect } from "react"
import CurrencyConverterModal from "./CurrencyConverterModal"
import PortfolioModal from "./PortfolioModal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"
import { useTranslation } from '@/app/i18n/client'

// Context import (to be created later)
import { useTradePositions } from "@/contexts/TradePositionsContext"

const Sidebar = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  
  // Use the context to get position data (will implement this later)
  const { positions = [] } = useTradePositions?.() || { positions: [] };
  const openPositionsCount = positions.length;

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">{t('app.title')}</h1>
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
              {t('nav.home')}
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
              {t('nav.markets')}
            </Link>
          </li>
          <li>
            <Link 
              href="/valores" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/valores" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <TrendingUp size={18} />
              Análisis Técnico
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
                "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/portfolio" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet size={18} />
                {t('nav.portfolio')}
              </div>
              {openPositionsCount > 0 && (
                <Badge 
                  variant="default"
                  className={cn(
                    "ml-auto bg-primary/20 text-primary-foreground hover:bg-primary/20",
                    pathname === "/portfolio" ? "bg-primary-foreground/20 text-primary" : ""
                  )}
                >
                  {openPositionsCount}
                </Badge>
              )}
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
          <li>
            <Link 
              href="/learning" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/learning" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <BookOpen size={18} />
              Aprendizaje
            </Link>
          </li>
          <li>
            <Link 
              href="/chat" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/chat" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <MessageSquare size={18} />
              Chat en Vivo
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
              {t('nav.settings')}
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
  const [totalValue, setTotalValue] = useState(0);
  const [isClient, setIsClient] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    setIsClient(true);
  }, []);

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
  }, []);

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="text-sm">
          {isClient ? t('nav.portfolio') : 'Portfolio'} Summary
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</p>
        <PortfolioModal />
      </CardContent>
    </Card>
  )
}

export default Sidebar
