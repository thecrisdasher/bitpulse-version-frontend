"use client"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Star } from "lucide-react"
import { cryptocurrencies, getTopGainers, getTopLosers, getTrending, favorites, toggleFavorite } from "@/lib/mockData"
import Sidebar from "@/components/Sidebar"
import MarketSentimentHeader from "@/components/MarketSentimentHeader"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/ThemeToggle"
import MarketOverviewBanner from "@/components/MarketOverviewBanner"
import TrendingPage from "@/components/TrendingPage"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import dynamic from "next/dynamic"

// Importación normal en lugar de dinámica para evitar errores
import RealTimeMarketChart from "@/components/RealTimeMarketChart"
// Mantener dinámica para TradeControlPanel
const TradeControlPanel = dynamic(() => import("@/components/TradeControlPanel"), { ssr: false });

// Helper function for consistent number formatting
const formatCurrency = (value: number, minimumFractionDigits = 2, maximumFractionDigits = 2) => {
  return `$${value.toLocaleString('en-US', { 
    minimumFractionDigits, 
    maximumFractionDigits 
  })}`;
};

const formatNumber = (value: number) => {
  return value.toLocaleString('en-US');
};

const BentoGrid = ({ liveUpdates, cryptoData }: { liveUpdates: boolean, cryptoData: any[] }) => {
  const [topGainers, setTopGainers] = useState(getTopGainers(cryptoData, 5))
  const [topLosers, setTopLosers] = useState(getTopLosers(cryptoData, 5))
  const [trending, setTrending] = useState(getTrending(cryptoData, 5))

  useEffect(() => {
    if (liveUpdates) {
      const interval = setInterval(() => {
        setTopGainers(getTopGainers(cryptoData, 5))
        setTopLosers(getTopLosers(cryptoData, 5))
        setTrending(getTrending(cryptoData, 5))
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [liveUpdates, cryptoData])

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Gainers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {topGainers.map((crypto) => (
              <li key={crypto.id} className="flex justify-between items-center">
                <span>{crypto.name}</span>
                <span className="text-green-500">+{crypto.change24h.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Top Losers</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {topLosers.map((crypto) => (
              <li key={crypto.id} className="flex justify-between items-center">
                <span>{crypto.name}</span>
                <span className="text-red-500">{crypto.change24h.toFixed(2)}%</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium">Trending</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2">
            {trending.map((crypto) => (
              <li key={crypto.id} className="flex justify-between items-center">
                <span>{crypto.name}</span>
                <span>
                  {formatCurrency(crypto.price)}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

export default function CryptoDashboard() {
  const [searchTerm, setSearchTerm] = useState("")
  const [favList, setFavList] = useState(favorites)
  const [liveUpdates, setLiveUpdates] = useState(true)
  const [cryptoData, setCryptoData] = useState(cryptocurrencies)
  const [selectedInstrument, setSelectedInstrument] = useState<any>(null)
  const [showTradePanel, setShowTradePanel] = useState(false)
  const { theme } = useTheme()

  useEffect(() => {
    if (liveUpdates) {
      const interval = setInterval(() => {
        setCryptoData((prevData) =>
          prevData.map((crypto) => ({
            ...crypto,
            price: crypto.price * (1 + (Math.random() * 0.02 - 0.01)),
            change24h: crypto.change24h + (Math.random() * 2 - 1),
            change7d: crypto.change7d + (Math.random() * 2 - 1),
          })),
        )
      }, 2000)

      return () => clearInterval(interval)
    }
  }, [liveUpdates])

  const filteredCryptos = cryptoData.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleFavoriteToggle = (id: number) => {
    toggleFavorite(id)
    setFavList([...favorites])
  }

  const handleCryptoSelection = (crypto: any) => {
    setSelectedInstrument(crypto)
    setShowTradePanel(true)
  }

  const closeTradePanel = () => {
    setShowTradePanel(false)
  }

  const renderCryptoList = (cryptos: { 
    id: number;
    name: string;
    symbol: string;
    price: number;
    change24h: number;
    change7d: number;
    marketCap: number;
    volume24h: number;
    circulatingSupply: number;
  }[]) => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]"></TableHead>
          <TableHead>#</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>24h %</TableHead>
          <TableHead>7d %</TableHead>
          <TableHead>Market Cap</TableHead>
          <TableHead>Volume(24h)</TableHead>
          <TableHead>Circulating Supply</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {cryptos.map((crypto, index) => (
          <TableRow 
            key={crypto.id} 
            className="cursor-pointer"
            onClick={() => handleCryptoSelection(crypto)}
          >
            <TableCell>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  handleFavoriteToggle(crypto.id)
                }}
              >
                <Star className={`h-4 w-4 ${favList.includes(crypto.id) ? "text-yellow-500 fill-yellow-500" : ""}`} />
              </Button>
            </TableCell>
            <TableCell>{index + 1}</TableCell>
            <TableCell className="font-medium">
              {crypto.name}
              <span className="ml-2 text-muted-foreground">{crypto.symbol}</span>
            </TableCell>
            <TableCell>
              {formatCurrency(crypto.price)}
            </TableCell>
            <TableCell className={crypto.change24h >= 0 ? "text-green-500" : "text-red-500"}>
              {crypto.change24h > 0 ? "+" : ""}
              {crypto.change24h.toFixed(2)}%
            </TableCell>
            <TableCell className={crypto.change7d >= 0 ? "text-green-500" : "text-red-500"}>
              {crypto.change7d > 0 ? "+" : ""}
              {crypto.change7d.toFixed(2)}%
            </TableCell>
            <TableCell>${formatNumber(crypto.marketCap)}</TableCell>
            <TableCell>${formatNumber(crypto.volume24h)}</TableCell>
            <TableCell>
              {formatNumber(crypto.circulatingSupply)} {crypto.symbol}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <header className="border-b border-border">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary lg:hidden">CryptoTracker</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-secondary text-secondary-foreground"
                />
                <Search
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground"
                  size={18}
                />
              </div>
              <nav className="hidden md:block">
                <ul className="flex space-x-4">
                  <li>
                    <Button variant="ghost">Cryptocurrencies</Button>
                  </li>
                  <li>
                    <Button variant="ghost">Exchanges</Button>
                  </li>
                  <li>
                    <Button variant="ghost">NFT</Button>
                  </li>
                  <li>
                    <Button variant="ghost">Portfolio</Button>
                  </li>
                </ul>
              </nav>
              <MarketSentimentHeader />
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Switch id="live-updates" checked={liveUpdates} onCheckedChange={setLiveUpdates} />
                <Label htmlFor="live-updates">Live Updates</Label>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex flex-col md:flex-row gap-4 mb-6">
            <div className={`flex-1 transition-all duration-300 ${showTradePanel ? 'md:w-2/3' : 'w-full'}`}>
              <RealTimeMarketChart />
            </div>
            
            {showTradePanel && selectedInstrument && (
              <div className="md:w-1/3 transition-all duration-300 ease-in-out">
                <TradeControlPanel
                  instrumentName={selectedInstrument.name}
                  instrumentPrice={selectedInstrument.price}
                  instrumentId={selectedInstrument.id.toString()}
                  onClose={closeTradePanel}
                />
              </div>
            )}
          </div>
          
          <MarketOverviewBanner liveUpdates={liveUpdates} />
          <BentoGrid liveUpdates={liveUpdates} cryptoData={cryptoData} />
          <Tabs defaultValue="all" className="space-y-4 mt-8">
            <TabsList className="bg-card">
              <TabsTrigger value="all">All Cryptocurrencies</TabsTrigger>
              <TabsTrigger value="favorites">Favorites</TabsTrigger>
              <TabsTrigger value="trending">Trending</TabsTrigger>
              <TabsTrigger value="gainers">Top Gainers</TabsTrigger>
              <TabsTrigger value="losers">Top Losers</TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="space-y-4">
              {renderCryptoList(filteredCryptos)}
            </TabsContent>
            <TabsContent value="favorites" className="space-y-4">
              {renderCryptoList(cryptoData.filter((crypto) => favList.includes(crypto.id)))}
            </TabsContent>
            <TabsContent value="trending" className="space-y-4">
              <TrendingPage liveUpdates={liveUpdates} />
            </TabsContent>
            <TabsContent value="gainers" className="space-y-4">
              {renderCryptoList(getTopGainers(cryptoData))}
            </TabsContent>
            <TabsContent value="losers" className="space-y-4">
              {renderCryptoList(getTopLosers(cryptoData))}
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  )
}
