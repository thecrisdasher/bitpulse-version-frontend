"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cryptocurrencies } from "@/lib/mockData"
import { Button } from "@/components/ui/button"
import { ArrowUpDown } from "lucide-react"

const CurrencyConverter = () => {
  const [amount, setAmount] = useState("1")
  const [fromCurrency, setFromCurrency] = useState("BTC")
  const [toCurrency, setToCurrency] = useState("USD")

  const fromCrypto = cryptocurrencies.find((c) => c.symbol === fromCurrency)
  const toCrypto = cryptocurrencies.find((c) => c.symbol === toCurrency)

  const convertedAmount =
    fromCrypto && toCrypto
      ? ((Number.parseFloat(amount) * fromCrypto.price) / (toCrypto.symbol === "USD" ? 1 : toCrypto.price)).toFixed(8)
      : "0"

  const handleSwap = () => {
    const temp = fromCurrency
    setFromCurrency(toCurrency)
    setToCurrency(temp)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Currency Converter</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount" />
          </div>
          <div className="flex space-x-2 items-center">
            <Select value={fromCurrency} onValueChange={setFromCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="From" />
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </SelectItem>
                ))}
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleSwap} size="icon" variant="outline">
              <ArrowUpDown className="h-4 w-4" />
            </Button>
            <Select value={toCurrency} onValueChange={setToCurrency}>
              <SelectTrigger>
                <SelectValue placeholder="To" />
              </SelectTrigger>
              <SelectContent>
                {cryptocurrencies.map((crypto) => (
                  <SelectItem key={crypto.symbol} value={crypto.symbol}>
                    {crypto.name} ({crypto.symbol})
                  </SelectItem>
                ))}
                <SelectItem value="USD">US Dollar (USD)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="text-lg font-semibold">
            {amount} {fromCurrency} = {convertedAmount} {toCurrency}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default CurrencyConverter
