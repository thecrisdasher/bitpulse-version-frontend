"use client"

import { useState } from "react"
import Sidebar from "@/components/Sidebar"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useAuth } from "@/contexts/AuthContext"
import { Coins, History, DollarSign, ArrowRight } from "lucide-react"
import { CompatButton as Button } from "@/components/ui/compat-button"

// Mock data for transaction history - will be replaced with API data
const mockTransactions = [
  { id: 't1', type: 'DEPOSITO ADMIN', amount: 10000, date: '2023-10-01', concept: 'Carga inicial de saldo' },
  { id: 't2', type: 'OPERACIÓN', amount: -500, date: '2023-10-02', concept: 'Compra de BTC/USD' },
  { id: 't3', type: 'OPERACIÓN', amount: 950, date: '2023-10-03', concept: 'Cierre de BTC/USD con ganancia' },
  { id: 't4', type: 'OPERACIÓN', amount: -1000, date: '2023-10-05', concept: 'Compra de ETH/USD' },
  { id: 't5', type: 'OPERACIÓN', amount: -800, date: '2023-10-06', concept: 'Cierre de ETH/USD con pérdida' },
];

export default function PejecoinsPage() {
  const { user } = useAuth();
  const [transactions] = useState(mockTransactions);

  const formatPejecoins = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <main className="flex-1 p-6">
          <header className="mb-8">
            <h1 className="text-3xl font-bold mb-2 flex items-center gap-2">
              <Coins className="w-8 h-8 text-primary" />
              Mis PejeCoins
            </h1>
            <p className="text-muted-foreground">
              Consulta tu saldo de dinero ficticio y tu historial de transacciones.
            </p>
          </header>

          <div className="container mx-auto max-w-7xl space-y-8">
            <Card className="w-full md:w-1/2 lg:w-1/3">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                  <DollarSign className="w-4 h-4" />
                  Saldo Actual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-4xl font-bold text-primary">
                  {formatPejecoins(user?.pejecoins || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Este es tu capital de práctica para operar sin riesgo.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Historial de Movimientos
                </CardTitle>
                <CardDescription>
                  Aquí puedes ver todas tus transacciones de PejeCoins.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {transactions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Concepto</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map(tx => (
                        <TableRow key={tx.id}>
                          <TableCell>{tx.date}</TableCell>
                          <TableCell>
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              tx.amount > 0 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {tx.type}
                            </span>
                          </TableCell>
                          <TableCell>{tx.concept}</TableCell>
                          <TableCell className={`text-right font-medium ${
                            tx.amount > 0 ? 'text-green-500' : 'text-red-500'
                          }`}>
                            {tx.amount > 0 ? '+' : ''}{formatPejecoins(tx.amount)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <p>No hay transacciones para mostrar.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
} 