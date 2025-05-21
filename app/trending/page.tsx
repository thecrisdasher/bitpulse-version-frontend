"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import TrendingPage from "@/components/TrendingPage"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getTrending, cryptocurrencies } from "@/lib/mockData"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { LineChart, BarChart, PieChart } from "lucide-react"
import PriceChart from "@/components/PriceChart"

export default function TrendingPageContainer() {
  const [trendingCryptos, setTrendingCryptos] = useState(getTrending(cryptocurrencies, 10))
  const [timeframe, setTimeframe] = useState("24h")
  
  // Simular actualización de datos de trending
  useEffect(() => {
    const interval = setInterval(() => {
      setTrendingCryptos(getTrending(cryptocurrencies, 10))
    }, 30000) // Actualizar cada 30 segundos
    
    return () => clearInterval(interval)
  }, [])
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Trending</h1>
            <p className="text-muted-foreground">
              Descubre las criptomonedas con mayor actividad y tendencia en las últimas 24 horas
            </p>
          </header>
          
          <Tabs defaultValue="trending" className="mb-8">
            <TabsList>
              <TabsTrigger value="trending">
                <LineChart className="h-4 w-4 mr-2" />
                Trending
              </TabsTrigger>
              <TabsTrigger value="volume">
                <BarChart className="h-4 w-4 mr-2" />
                Por Volumen
              </TabsTrigger>
              <TabsTrigger value="marketcap">
                <PieChart className="h-4 w-4 mr-2" />
                Por Market Cap
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="trending" className="mt-4">
              <TrendingPage liveUpdates={true} />
            </TabsContent>
            
            <TabsContent value="volume" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trendingCryptos.slice(0, 6).map((crypto) => (
                  <Card key={crypto.id}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex justify-between">
                        <span>{crypto.name} ({crypto.symbol})</span>
                        <span className={crypto.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                          {crypto.change24h > 0 ? "+" : ""}{crypto.change24h.toFixed(2)}%
                        </span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold mb-2">${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                      <div className="text-sm text-muted-foreground mb-4">
                        Vol: ${crypto.volume24h.toLocaleString()}
                      </div>
                      <PriceChart priceHistory={crypto.priceHistory || []} />
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            
            <TabsContent value="marketcap" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {cryptocurrencies
                  .sort((a, b) => b.marketCap - a.marketCap)
                  .slice(0, 6)
                  .map((crypto) => (
                    <Card key={crypto.id}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg flex justify-between">
                          <span>{crypto.name} ({crypto.symbol})</span>
                          <span className={crypto.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                            {crypto.change24h > 0 ? "+" : ""}{crypto.change24h.toFixed(2)}%
                          </span>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold mb-2">${crypto.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                        <div className="text-sm text-muted-foreground mb-4">
                          MCap: ${crypto.marketCap.toLocaleString()}
                        </div>
                        <PriceChart priceHistory={crypto.priceHistory || []} />
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 