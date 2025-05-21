"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, BarChart, ArrowUpRight, ArrowDownRight, Plus, Wallet, History } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { cryptocurrencies } from "@/lib/mockData"
import PriceChart from "@/components/PriceChart"
import PortfolioTracker from "@/components/PortfolioTracker"

// Mock portfolio data
const mockPortfolio = [
  { symbol: "BTC", amount: 0.5, price: 0, value: 0, allocation: 0 },
  { symbol: "ETH", amount: 5, price: 0, value: 0, allocation: 0 },
  { symbol: "ADA", amount: 1000, price: 0, value: 0, allocation: 0 },
  { symbol: "SOL", amount: 10, price: 0, value: 0, allocation: 0 },
  { symbol: "DOT", amount: 100, price: 0, value: 0, allocation: 0 },
]

// Mock transactions
const mockTransactions = [
  { id: 1, type: "buy", symbol: "BTC", amount: 0.2, price: 29000, date: "2023-06-10", value: 5800 },
  { id: 2, type: "buy", symbol: "ETH", amount: 2, price: 1800, date: "2023-06-15", value: 3600 },
  { id: 3, type: "sell", symbol: "BTC", amount: 0.1, price: 30000, date: "2023-07-05", value: 3000 },
  { id: 4, type: "buy", symbol: "ADA", amount: 1000, price: 0.3, date: "2023-07-10", value: 300 },
  { id: 5, type: "buy", symbol: "SOL", amount: 10, price: 20, date: "2023-07-20", value: 200 },
  { id: 6, type: "buy", symbol: "DOT", amount: 100, price: 5, date: "2023-08-01", value: 500 },
  { id: 7, type: "buy", symbol: "BTC", amount: 0.4, price: 28000, date: "2023-08-10", value: 11200 },
  { id: 8, type: "buy", symbol: "ETH", amount: 3, price: 1700, date: "2023-08-15", value: 5100 },
  { id: 9, type: "sell", symbol: "ADA", amount: 500, price: 0.35, date: "2023-09-05", value: 175 },
  { id: 10, type: "buy", symbol: "SOL", amount: 5, price: 22, date: "2023-09-10", value: 110 },
]

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(mockPortfolio)
  const [totalValue, setTotalValue] = useState(0)
  const [transactions, setTransactions] = useState(mockTransactions)
  const [performance, setPerformance] = useState({ 
    daily: 2.5, 
    weekly: -1.2, 
    monthly: 15.3, 
    allTime: 45.7 
  })
  
  // Calcular valores actuales del portfolio
  useEffect(() => {
    const updatedPortfolio = mockPortfolio.map(asset => {
      const crypto = cryptocurrencies.find(c => c.symbol === asset.symbol)
      const price = crypto ? crypto.price : 0
      const value = price * asset.amount
      
      return {
        ...asset,
        price,
        value
      }
    })
    
    const total = updatedPortfolio.reduce((sum, asset) => sum + asset.value, 0)
    
    // Calcular la asignación (porcentaje del portfolio)
    const portfolioWithAllocation = updatedPortfolio.map(asset => ({
      ...asset,
      allocation: total > 0 ? (asset.value / total) * 100 : 0
    }))
    
    setPortfolio(portfolioWithAllocation)
    setTotalValue(total)
  }, [])
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Portfolio</h1>
            <p className="text-muted-foreground">
              Gestiona y monitorea tus inversiones en criptomonedas
            </p>
          </header>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Valor Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                <div className="flex items-center text-sm mt-1">
                  <span className={performance.daily >= 0 ? "text-green-500 flex items-center" : "text-red-500 flex items-center"}>
                    {performance.daily > 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                    {performance.daily > 0 ? "+" : ""}{performance.daily}%
                  </span>
                  <span className="text-muted-foreground ml-2">24h</span>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento Semanal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={performance.weekly >= 0 ? "text-green-500" : "text-red-500"}>
                    {performance.weekly > 0 ? "+" : ""}{performance.weekly}%
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground text-sm">Últimos 7 días</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento Mensual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={performance.monthly >= 0 ? "text-green-500" : "text-red-500"}>
                    {performance.monthly > 0 ? "+" : ""}{performance.monthly}%
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground text-sm">Últimos 30 días</div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Rendimiento Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  <span className={performance.allTime >= 0 ? "text-green-500" : "text-red-500"}>
                    {performance.allTime > 0 ? "+" : ""}{performance.allTime}%
                  </span>
                </div>
                <div className="mt-1 text-muted-foreground text-sm">Desde el inicio</div>
              </CardContent>
            </Card>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Portfolio Tracker</CardTitle>
                <CardDescription>
                  Seguimiento del valor de tu portfolio a lo largo del tiempo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PortfolioTracker />
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Distribución de Activos</CardTitle>
                <CardDescription>
                  Asignación de tu portfolio por activo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {portfolio.map(asset => (
                    <div key={asset.symbol} className="space-y-2">
                      <div className="flex justify-between">
                        <span>{asset.symbol}</span>
                        <span>{asset.allocation.toFixed(2)}%</span>
                      </div>
                      <Progress value={asset.allocation} />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <Tabs defaultValue="assets" className="mb-8">
            <TabsList>
              <TabsTrigger value="assets">
                <Wallet className="h-4 w-4 mr-2" />
                Activos
              </TabsTrigger>
              <TabsTrigger value="transactions">
                <History className="h-4 w-4 mr-2" />
                Transacciones
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="assets" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Mis Activos</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Añadir Activo
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Activo</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Asignación</TableHead>
                        <TableHead className="text-right">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {portfolio.map(asset => (
                        <TableRow key={asset.symbol}>
                          <TableCell className="font-medium">{asset.symbol}</TableCell>
                          <TableCell>${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{asset.amount}</TableCell>
                          <TableCell>${asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>{asset.allocation.toFixed(2)}%</TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="sm">Editar</Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="transactions" className="mt-4">
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle>Historial de Transacciones</CardTitle>
                    <Button size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Nueva Transacción
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Activo</TableHead>
                        <TableHead>Cantidad</TableHead>
                        <TableHead>Precio</TableHead>
                        <TableHead>Valor</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${tx.type === 'buy' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'}`}>
                              {tx.type === 'buy' ? 'Compra' : 'Venta'}
                            </span>
                          </TableCell>
                          <TableCell className="font-medium">{tx.symbol}</TableCell>
                          <TableCell>{tx.amount}</TableCell>
                          <TableCell>${tx.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                          <TableCell>${tx.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
} 