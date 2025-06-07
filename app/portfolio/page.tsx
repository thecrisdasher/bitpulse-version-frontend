"use client"

import { useState, useEffect } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { CompatButton as Button } from "@/components/ui/compat-button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { PieChart, BarChart, ArrowUpRight, ArrowDownRight, Plus, Wallet, History, TrendingUp, Clock, Shield, Target } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import OpenPositions from "@/components/OpenPositions"
import { useTradePositions } from "@/contexts/TradePositionsContext"
import { CompatBadge as Badge } from "@/components/ui/compat-badge"
import { AdvancedPortfolioManager } from "@/components/enhanced-portfolio/AdvancedPortfolioManager"
import { RiskManagement } from "@/components/RiskManagement"
import { useAuth } from "@/contexts/AuthContext"

// Define types for portfolio and transactions
interface PortfolioAsset {
  symbol: string;
  amount: number;
  price: number;
  value: number;
  allocation: number;
}

interface Transaction {
  id: number;
  type: 'buy' | 'sell';
  symbol: string;
  amount: number;
  price: number;
  date: string;
  value: number;
}

export default function PortfolioPage() {
  const { user } = useAuth();
  const [portfolio, setPortfolio] = useState<PortfolioAsset[]>([])
  const [totalValue, setTotalValue] = useState(0)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [performance, setPerformance] = useState({ 
    daily: 0, 
    weekly: 0, 
    monthly: 0, 
    allTime: 0 
  })
  
  // Get open positions from context
  const { positions, removePosition } = useTradePositions();
  
  // In a real application, portfolio and transactions would be fetched from a backend
  // For now, we'll derive some basic info from open positions
  useEffect(() => {
    // This is a placeholder for future logic that will fetch user-specific portfolio data.
    // Currently, it just calculates total value from open positions for demonstration.
    const newTotalValue = positions.reduce((sum, pos) => sum + pos.amount, 0);
    setTotalValue(newTotalValue);

    // Placeholder for real portfolio assets
    const assets: PortfolioAsset[] = positions.map(pos => ({
      symbol: pos.marketName,
      amount: pos.lotSize,
      price: pos.currentPrice,
      value: pos.positionValue,
      allocation: 0
    }));

    const portfolioWithAllocation = assets.map(asset => ({
      ...asset,
      allocation: newTotalValue > 0 ? (asset.value / newTotalValue) * 100 : 0
    }));
    
    setPortfolio(portfolioWithAllocation);

  }, [positions])
  
  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2">Portfolio de {user?.firstName || 'Usuario'}</h1>
            <p className="text-muted-foreground">
              Gestiona y monitorea tus operaciones y rendimiento.
            </p>
          </header>
          
          <div className="container mx-auto max-w-7xl">
            {positions.length === 0 && portfolio.length === 0 && transactions.length === 0 ? (
              <Card className="text-center py-20">
                <CardHeader>
                  <Target className="w-16 h-16 mx-auto text-primary mb-4" />
                  <CardTitle>¡Bienvenido a tu Portfolio!</CardTitle>
                  <CardDescription>
                    Aquí podrás ver un resumen de tus activos, posiciones abiertas y rendimiento.
                    <br />
                    Realiza tu primera operación para comenzar.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild>
                    <a href="/" className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Ir a Operar
                    </a>
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <>
            <div className="mb-8">
                  <h2 className="text-2xl font-bold mb-2">Resumen del Portfolio</h2>
              <p className="text-muted-foreground">
                    Análisis de riesgo y balance de tu cuenta.
              </p>
            </div>

                {/* This component can be adapted to show real data later */}
            <div className="mb-8">
              <AdvancedPortfolioManager />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">Valor Total (en Posiciones)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalValue.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
                  <div className="flex items-center text-sm mt-1">
                    <span className={performance.daily >= 0 ? "text-green-500 flex items-center" : "text-red-500 flex items-center"}>
                          {performance.daily >= 0 ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
                          {performance.daily >= 0 ? "+" : ""}{performance.daily}%
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
                          {performance.weekly >= 0 ? "+" : ""}{performance.weekly}%
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
                          {performance.monthly >= 0 ? "+" : ""}{performance.monthly}%
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
                          {performance.allTime >= 0 ? "+" : ""}{performance.allTime}%
                    </span>
                  </div>
                  <div className="mt-1 text-muted-foreground text-sm">Desde el inicio</div>
                </CardContent>
              </Card>
            </div>
            
                {/* Open Positions Section */}
            {positions.length > 0 && (
                  <div className="my-8">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <CardTitle>Posiciones Abiertas</CardTitle>
                        <Badge variant="secondary" className="ml-2">
                          {positions.length}
                        </Badge>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <a href="/" className="flex items-center gap-1">
                          <TrendingUp className="h-4 w-4" />
                          <span>Operar</span>
                        </a>
                      </Button>
                    </div>
                    <CardDescription>
                      Operaciones activas en diversos mercados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <OpenPositions 
                      positions={positions}
                      onClosePosition={removePosition}
                    />
                  </CardContent>
                </Card>
              </div>
            )}
            
            <Tabs defaultValue="assets" className="space-y-6">
              <TabsList>
                <TabsTrigger value="assets">
                  <Wallet className="h-4 w-4 mr-2" />
                  Activos
                </TabsTrigger>
                <TabsTrigger value="transactions">
                  <History className="h-4 w-4 mr-2" />
                  Transacciones
                </TabsTrigger>
                <TabsTrigger value="risk">
                  <Shield className="h-4 w-4 mr-2" />
                  Gestión de Riesgo
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="assets" className="mt-4">
                <Card>
                  <CardHeader>
                      <CardTitle>Mis Activos</CardTitle>
                  </CardHeader>
                  <CardContent>
                        {portfolio.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activo</TableHead>
                          <TableHead>Precio</TableHead>
                                <TableHead>Cantidad (Lotes)</TableHead>
                          <TableHead>Valor</TableHead>
                          <TableHead>Asignación</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {portfolio.map(asset => (
                          <TableRow key={asset.symbol}>
                            <TableCell className="font-medium">{asset.symbol}</TableCell>
                            <TableCell>${asset.price.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                                  <TableCell>{asset.amount.toFixed(2)}</TableCell>
                            <TableCell>${asset.value.toLocaleString(undefined, { maximumFractionDigits: 2 })}</TableCell>
                            <TableCell>{asset.allocation.toFixed(2)}%</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>No tienes activos en tu portfolio.</p>
                            <p className="text-sm mt-2">Tus activos aparecerán aquí cuando abras posiciones.</p>
                          </div>
                        )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="transactions" className="mt-4">
                <Card>
                  <CardHeader>
                      <CardTitle>Historial de Transacciones</CardTitle>
                  </CardHeader>
                  <CardContent>
                      <div className="text-center py-8 text-muted-foreground">
                          <Clock className="w-16 h-16 mx-auto mb-4" />
                          <p>No hay transacciones para mostrar.</p>
                          <p className="text-sm mt-2">Tu historial de compras y ventas aparecerá aquí.</p>
                      </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="risk" className="mt-4">
                <Card>
                  <CardHeader>
                        <CardTitle>Gestión de Riesgo del Portfolio</CardTitle>
                    <CardDescription>
                          Análisis y gestión del riesgo de tu portfolio
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RiskManagement />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
} 