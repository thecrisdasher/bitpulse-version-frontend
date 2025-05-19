"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cryptocurrencies } from "@/lib/mockData"
import { Plus, Trash2 } from "lucide-react"

const PortfolioTracker = () => {
  const [portfolio, setPortfolio] = useState([
    { symbol: "BTC", amount: 0.5 },
    { symbol: "ETH", amount: 5 },
    { symbol: "ADA", amount: 1000 },
  ])
  const [newAsset, setNewAsset] = useState({ symbol: "BTC", amount: "" })

  const addAsset = () => {
    if (newAsset.amount && Number.parseFloat(newAsset.amount) > 0) {
      setPortfolio([...portfolio, { ...newAsset, amount: Number.parseFloat(newAsset.amount) }])
      setNewAsset({ symbol: "BTC", amount: "" })
    }
  }

  const removeAsset = (symbol: string) => {
    setPortfolio(portfolio.filter((asset) => asset.symbol !== symbol))
  }

  const portfolioWithValues = portfolio.map((item) => {
    const crypto = cryptocurrencies.find((c) => c.symbol === item.symbol)
    return {
      ...item,
      value: crypto ? crypto.price * item.amount : 0,
      change24h: crypto ? crypto.change24h : 0,
    }
  })

  const totalValue = portfolioWithValues.reduce((sum, item) => sum + item.value, 0)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Portfolio</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold mb-4">Total Value: ${totalValue.toLocaleString()}</div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Asset</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>24h Change</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {portfolioWithValues.map((item) => (
              <TableRow key={item.symbol}>
                <TableCell>{item.symbol}</TableCell>
                <TableCell>{item.amount}</TableCell>
                <TableCell>${item.value.toLocaleString()}</TableCell>
                <TableCell className={item.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                  {item.change24h > 0 ? "+" : ""}
                  {item.change24h}%
                </TableCell>
                <TableCell>
                  <Button variant="ghost" size="sm" onClick={() => removeAsset(item.symbol)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <div className="mt-4 flex space-x-2">
          <Select value={newAsset.symbol} onValueChange={(value) => setNewAsset({ ...newAsset, symbol: value })}>
            <SelectTrigger>
              <SelectValue placeholder="Select asset" />
            </SelectTrigger>
            <SelectContent>
              {cryptocurrencies.map((crypto) => (
                <SelectItem key={crypto.symbol} value={crypto.symbol}>
                  {crypto.name} ({crypto.symbol})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="number"
            placeholder="Amount"
            value={newAsset.amount}
            onChange={(e) => setNewAsset({ ...newAsset, amount: e.target.value })}
          />
          <Button onClick={addAsset}>
            <Plus className="h-4 w-4 mr-2" /> Add Asset
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default PortfolioTracker
