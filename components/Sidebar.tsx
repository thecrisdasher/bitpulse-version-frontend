"use client"

import { Home, TrendingUp, BarChart2, PlusCircle, Settings, Wallet, HelpCircle, CandlestickChart, LineChart, MessageSquare, BookOpen, LogOut, Coins, Shield } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cryptocurrencies } from "@/lib/mockData"
import { useState, useEffect } from "react"
import CurrencyConverterModal from "./CurrencyConverterModal"
import PortfolioModal from "./PortfolioModal"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import { CompatBadge as Badge } from "@/components/ui/compat-badge"
import { useTranslation } from '@/app/i18n/client'

// Context import (to be created later)
import { useTradePositions } from "@/contexts/TradePositionsContext"
import { useAuth } from "@/contexts/AuthContext"

const Sidebar = () => {
  const pathname = usePathname();
  const { t } = useTranslation();
  const { logout, isAuthenticated, hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const isMaestro = hasRole('maestro');
  
  // Use the context to get position data
  const { positions = [] } = useTradePositions?.() || { positions: [] };
  const openPositionsCount = positions.length;

  const canAccessCrm = isAdmin;

  return (
    <div className="hidden lg:flex flex-col h-screen w-64 bg-card border-r border-border">
      <div className="p-6">
        <h1 className="text-2xl font-bold text-primary">{t('app.title')}</h1>
      </div>
      <nav className="flex-1 overflow-y-auto">
        <ul className="px-2 space-y-1">
          {!isMaestro && (
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
          )}
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
          {(!isMaestro || isMaestro) && (
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
          </li>)}
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
          {!isMaestro && (
          <>
          <li>
            <Link 
              href="/posiciones-abiertas" 
              className={cn(
                "flex items-center justify-between px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/posiciones-abiertas" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <div className="flex items-center gap-3">
                <Wallet size={18} />
                Posiciones Abiertas
              </div>
              {openPositionsCount > 0 && (
                <Badge 
                  variant="default"
                  className={cn(
                    "ml-auto bg-primary/20 text-primary-foreground hover:bg-primary/20",
                    pathname === "/posiciones-abiertas" ? "bg-primary-foreground/20 text-primary" : ""
                  )}
                >
                  {openPositionsCount}
                </Badge>
              )}
            </Link>
          </li>
          <li>
            <Link 
              href="/pejecoins" 
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                pathname === "/pejecoins" ? "bg-primary text-primary-foreground" : "hover:bg-muted"
              )}
            >
              <Coins size={18} />
              Mis PejeCoins
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
          </>)}
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

          {/* CRM Navigation */}
          {canAccessCrm && (
            <>
              <li className="px-3 pt-4 pb-2 text-xs font-semibold text-muted-foreground uppercase">
                CRM
              </li>
              <li>
                <Link
                  href="/crm"
                  className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
                    pathname && pathname.startsWith("/crm") ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  <Shield size={18} />
                  Dashboard CRM
                </Link>
              </li>
            </>
          )}
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
          {isAuthenticated && (
            <li>
              <button
                onClick={logout}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors text-left",
                  "hover:bg-rose-500/10 hover:text-rose-500"
                )}
              >
                <LogOut size={18} />
                Cerrar sesión
              </button>
            </li>
          )}
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
  const { positions } = useTradePositions();

  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    const calculatedValue = positions.reduce((sum, pos) => sum + pos.amount, 0);
    setTotalValue(calculatedValue);
  }, [positions]);

  if (positions.length === 0) {
    return null;
  }

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
