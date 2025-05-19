"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { getTrending, cryptocurrencies } from "@/lib/mockData"
import { ArrowUpDown, Search } from "lucide-react"

const TrendingPage = ({ liveUpdates }) => {
  const [trendingCryptos, setTrendingCryptos] = useState(getTrending(cryptocurrencies, 20))
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "rank", direction: "ascending" })

  useEffect(() => {
    if (liveUpdates) {
      const interval = setInterval(() => {
        setTrendingCryptos((prevCryptos) =>
          getTrending(
            prevCryptos.map((crypto) => ({
              ...crypto,
              price: crypto.price * (1 + (Math.random() * 0.02 - 0.01)),
              change24h: crypto.change24h + (Math.random() * 2 - 1),
            })),
            20,
          ),
        )
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [liveUpdates])

  const handleSort = (key: string) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })

    setTrendingCryptos(
      trendingCryptos.sort((a, b) => {
        if (a[key] < b[key]) return direction === "ascending" ? -1 : 1
        if (a[key] > b[key]) return direction === "ascending" ? 1 : -1
        return 0
      }),
    )
  }

  const filteredCryptos = trendingCryptos.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Trending Cryptocurrencies</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex justify-between items-center mb-4">
          <div className="relative w-64">
            <Input
              type="text"
              placeholder="Search trending"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
          </div>
          <Select onValueChange={(value) => handleSort(value)} defaultValue="rank">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rank">Rank</SelectItem>
              <SelectItem value="price">Price</SelectItem>
              <SelectItem value="change24h">24h Change</SelectItem>
              <SelectItem value="volume24h">24h Volume</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort("change24h")}>
                  24h Change
                  <ArrowUpDown className="ml-2 h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Market Cap</TableHead>
              <TableHead>Volume (24h)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCryptos.map((crypto, index) => (
              <TableRow key={crypto.id}>
                <TableCell>{index + 1}</TableCell>
                <TableCell className="font-medium">
                  {crypto.name}
                  <span className="ml-2 text-muted-foreground">{crypto.symbol}</span>
                </TableCell>
                <TableCell>
                  ${crypto.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </TableCell>
                <TableCell className={crypto.change24h >= 0 ? "text-green-500" : "text-red-500"}>
                  {crypto.change24h > 0 ? "+" : ""}
                  {crypto.change24h.toFixed(2)}%
                </TableCell>
                <TableCell>${crypto.marketCap.toLocaleString()}</TableCell>
                <TableCell>${crypto.volume24h.toLocaleString()}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

export default TrendingPage
