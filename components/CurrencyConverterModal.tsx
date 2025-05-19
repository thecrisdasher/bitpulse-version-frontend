"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cryptocurrencies } from "@/lib/mockData"
import { ArrowUpDown } from "lucide-react"

const CurrencyConverterModal = () => {
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
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline">Currency Converter</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Currency Converter</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Input
              id="amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Amount"
            />
          </div>
          <div className="grid grid-cols-3 items-center gap-4">
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
      </DialogContent>
    </Dialog>
  )
}

export default CurrencyConverterModal
