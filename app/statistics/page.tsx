"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart2, PieChart, AreaChart, LineChart, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"
import { cryptocurrencies } from "@/lib/mockData"

// Datos simulados de estadísticas del mercado
const marketStats = {
  totalMarketCap: 1245678901234,
  volume24h: 98765432100,
  btcDominance: 52.3,
  activeCryptos: 2347,
  totalExchanges: 78
}

// Datos simulados para gráficos de mercado
const marketCapDistribution = [
  { name: "Bitcoin", value: 52.3 },
  { name: "Ethereum", value: 18.7 },
  { name: "Binance Coin", value: 5.2 },
  { name: "XRP", value: 3.1 },
  { name: "Cardano", value: 2.8 },
  { name: "Otros", value: 17.9 }
]

export default function StatisticsPage() {
  const [timeframe, setTimeframe] = useState("7d")
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Estadísticas del Mercado</h1>
            <p className="text-muted-foreground">
              Análisis detallado del mercado de criptomonedas
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Capitalización Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(marketStats.totalMarketCap / 1000000000000).toFixed(2)}T</div>
                <div className="flex items-center text-sm mt-1">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +2.3%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Volumen 24h</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${(marketStats.volume24h / 1000000000).toFixed(2)}B</div>
                <div className="flex items-center text-sm mt-1">
                  <span className="text-red-500 flex items-center">
                    <ArrowDownRight className="h-4 w-4 mr-1" />
                    -5.7%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dominancia BTC</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketStats.btcDominance}%</div>
                <div className="flex items-center text-sm mt-1">
                  <span className="text-green-500 flex items-center">
                    <ArrowUpRight className="h-4 w-4 mr-1" />
                    +0.2%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Criptomonedas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketStats.activeCryptos.toLocaleString()}</div>
                <div className="text-muted-foreground text-sm mt-1">Activas</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Exchanges</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{marketStats.totalExchanges}</div>
                <div className="text-muted-foreground text-sm mt-1">Activos</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="mb-8">
            <Card className="w-full">
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                  <div>
                    <CardTitle>Capitalización del Mercado</CardTitle>
                    <CardDescription>Valor total del mercado a lo largo del tiempo</CardDescription>
                  </div>
                  <Select value={timeframe} onValueChange={setTimeframe}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Seleccionar periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24h">24 Horas</SelectItem>
                      <SelectItem value="7d">7 Días</SelectItem>
                      <SelectItem value="30d">30 Días</SelectItem>
                      <SelectItem value="90d">90 Días</SelectItem>
                      <SelectItem value="1y">1 Año</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent className="h-[350px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <AreaChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Visualización de datos de mercado</p>
                  <p className="text-sm">(Integración de gráficos real en implementación)</p>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="market" className="mb-8">
            <TabsList>
              <TabsTrigger value="market">
                <PieChart className="h-4 w-4 mr-2" />
                Distribución
              </TabsTrigger>
              <TabsTrigger value="performance">
                <BarChart2 className="h-4 w-4 mr-2" />
                Rendimiento
              </TabsTrigger>
              <TabsTrigger value="correlation">
                <LineChart className="h-4 w-4 mr-2" />
                Correlación
              </TabsTrigger>
              <TabsTrigger value="trends">
                <TrendingUp className="h-4 w-4 mr-2" />
                Tendencias
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="market" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Distribución de la Capitalización</CardTitle>
                    <CardDescription>
                      Porcentaje de la capitalización total del mercado por criptomoneda
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[350px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <PieChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Visualización de distribución por capitalización</p>
                      <p className="text-sm">(Integración de gráficos real en implementación)</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Principales por Dominancia</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {marketCapDistribution.map((item) => (
                        <div key={item.name} className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-2 h-2 rounded-full bg-primary mr-2"></div>
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="performance" className="mt-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Rendimiento por Categoría</CardTitle>
                    <CardDescription>
                      Comparativa de rendimiento entre diferentes categorías de criptomonedas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <BarChart2 className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Visualización de rendimiento por categoría</p>
                      <p className="text-sm">(Integración de gráficos real en implementación)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="correlation" className="mt-4">
              <div className="grid grid-cols-1 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Correlación de Activos</CardTitle>
                    <CardDescription>
                      Análisis de correlación entre las principales criptomonedas
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <LineChart className="h-16 w-16 mx-auto mb-4 opacity-20" />
                      <p>Mapa de correlación entre activos</p>
                      <p className="text-sm">(Integración de gráficos real en implementación)</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
            
            <TabsContent value="trends" className="mt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencias Alcistas</CardTitle>
                    <CardDescription>
                      Activos con mayor crecimiento en el último periodo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cryptocurrencies
                        .sort((a, b) => b.change24h - a.change24h)
                        .filter(c => c.change24h > 0)
                        .slice(0, 5)
                        .map((crypto) => (
                          <div key={crypto.id} className="flex justify-between items-center">
                            <span className="font-medium">{crypto.name} ({crypto.symbol})</span>
                            <span className="text-green-500">+{crypto.change24h.toFixed(2)}%</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Tendencias Bajistas</CardTitle>
                    <CardDescription>
                      Activos con mayor caída en el último periodo
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {cryptocurrencies
                        .sort((a, b) => a.change24h - b.change24h)
                        .filter(c => c.change24h < 0)
                        .slice(0, 5)
                        .map((crypto) => (
                          <div key={crypto.id} className="flex justify-between items-center">
                            <span className="font-medium">{crypto.name} ({crypto.symbol})</span>
                            <span className="text-red-500">{crypto.change24h.toFixed(2)}%</span>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 