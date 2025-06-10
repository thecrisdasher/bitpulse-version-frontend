"use client"

import React, { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { CompatButton as Button } from "@/components/ui/compat-button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Search, Star } from "lucide-react"
import { cryptocurrencies, getTopGainers, getTopLosers, getTrending, favorites, toggleFavorite } from "@/lib/mockData"
import useBinanceTickers from '@/hooks/useBinanceTickers';
import Sidebar from "@/components/Sidebar"
import MarketSentimentHeader from "@/components/MarketSentimentHeader"
import { useTheme } from "next-themes"
import { ThemeToggle } from "@/components/ThemeToggle"
import MarketOverviewBanner from "@/components/MarketOverviewBanner"
import TrendingPage from "@/components/TrendingPage"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { LanguageSelector } from "@/components/LanguageSelector"
import { useTranslation } from '@/app/i18n/client'
import dynamic from "next/dynamic"
import { AIOpportunityWidget, PersonalStreakWidget, AchievementsWidget, HotMarketWidget, SmartAlertsWidget, DailyChallengeWidget, TradingPositionsWidget } from '@/components/DashboardWidgets'
import { useTradePositions } from "@/contexts/TradePositionsContext"

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
  const { t } = useTranslation();
  const [isClient, setIsClient] = useState(false);
  
  useEffect(() => {
    setIsClient(true);
  }, []);

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
          <CardTitle className="text-sm font-medium">
            {isClient ? t('markets.topGainers') : 'Top Gainers'}
          </CardTitle>
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
          <CardTitle className="text-sm font-medium">
            {isClient ? t('markets.topLosers') : 'Top Losers'}
          </CardTitle>
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
          <CardTitle className="text-sm font-medium">
            {isClient ? t('markets.trending') : 'Trending'}
          </CardTitle>
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
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState("")
  const [favList, setFavList] = useState<number[]>([])
  const [liveUpdates, setLiveUpdates] = useState(true)
  const [cryptoData, setCryptoData] = useState(cryptocurrencies)
  // Fetch Binance tickers for all crypto symbols
  const binanceTickers = useBinanceTickers(cryptocurrencies.map(c => c.symbol));
  // Merge live Binance data into cryptoData
  const displayData = cryptoData.map(crypto => {
    const ticker = binanceTickers[crypto.symbol];
    return {
      ...crypto,
      price: ticker?.price ?? crypto.price,
      change24h: ticker?.change24h ?? crypto.change24h,
      volume24h: ticker?.volume ?? crypto.volume24h,
    };
  });
  // Track selected instrument by its numeric ID
  const [selectedInstrumentId, setSelectedInstrumentId] = useState<number | null>(null)
  const [showTradePanel, setShowTradePanel] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const { theme } = useTheme()

  // Get trading context for real integration
  const { addPosition } = useTradePositions();

  // Wait for client-side hydration before rendering favorites
  useEffect(() => {
    setFavList([...favorites])
    setIsClient(true)
  }, [])

  // Removed simulated live updates; table now uses API data only

  const filteredCryptos = displayData.filter(
    (crypto) =>
      crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const handleFavoriteToggle = (id: number) => {
    toggleFavorite(id)
    setFavList([...favorites])
  }

  const handleCryptoSelection = (crypto: any) => {
    setSelectedInstrumentId(crypto.id)
    setShowTradePanel(true)
  }

  const closeTradePanel = () => {
    setShowTradePanel(false)
    setSelectedInstrumentId(null)
  }

  // Always derive current instrument from live displayData
  const currentInstrument = selectedInstrumentId !== null
    ? displayData.find(c => c.id === selectedInstrumentId)
    : null;

  // Handle trade execution from TradeControlPanel
  const handleTradeExecution = useCallback((
    direction: 'up' | 'down',
    amount: number,
    stake: number,
    duration: { value: number; unit: 'minute' | 'hour' | 'day' }
  ) => {
    if (!currentInstrument) return;
    try {
      const instrumentColor = currentInstrument.change24h >= 0 ? '#10b981' : '#ef4444';
      addPosition({
        marketName: currentInstrument.name,
        marketPrice: currentInstrument.price,
        marketColor: instrumentColor,
        direction,
        amount,
        stake,
        duration,
        capitalFraction: 0.10,
        lotSize: 1.0,
        leverage: 100
      });
    
    console.log('Trade executed successfully:', {
        instrument: currentInstrument.name,
        direction,
        amount,
        stake,
        duration
      });
    } catch (error) {
      console.error('Error executing trade:', error);
    }
  }, [currentInstrument, addPosition]);

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
          <React.Fragment key={crypto.id}>
            <TableRow 
              className="cursor-pointer hover:bg-muted/50 transition-colors group"
              onClick={() => handleCryptoSelection(crypto)}
            >
              <TableCell>
                {isClient && (
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
                )}
                {!isClient && (
                  <Button
                    variant="ghost"
                    size="sm"
                  >
                    <Star className="h-4 w-4" />
                  </Button>
                )}
              </TableCell>
              <TableCell>{index + 1}</TableCell>
              <TableCell className="font-medium">
                <div className="flex items-center gap-2">
                  <span>{crypto.name}</span>
                  <span className="ml-2 text-muted-foreground">{crypto.symbol}</span>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity ml-auto">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-6 px-2 text-xs bg-primary/10 border-primary/20 text-primary hover:bg-primary hover:text-primary-foreground"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCryptoSelection(crypto);
                      }}
                    >
                      📈 Operar
                    </Button>
                  </div>
                </div>
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
            
            {/* Panel de Trading Inline - Se despliega debajo del elemento seleccionado */}
            {showTradePanel && currentInstrument && currentInstrument.id === crypto.id && (
              <TableRow>
                <TableCell colSpan={9} className="p-0">
                  <div className="border-t bg-muted/20">
                    <TradeControlPanel
                      marketId={currentInstrument.symbol}
                      marketName={currentInstrument.name}
                      marketPrice={currentInstrument.price}
                      marketColor={currentInstrument.change24h >= 0 ? '#10b981' : '#ef4444'}
                      isVisible={showTradePanel}
                      onClose={closeTradePanel}
                      onPlaceTrade={handleTradeExecution}
                    />
                  </div>
                </TableCell>
              </TableRow>
            )}
          </React.Fragment>
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
            <h1 className="text-2xl font-bold text-primary lg:hidden">{isClient ? t('app.title') : 'BitPulse'}</h1>
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Input
                  type="text"
                  placeholder={isClient ? t('nav.search') : 'Search'}
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
                    <Button variant="ghost">{isClient ? t('markets.crypto') : 'Cryptocurrencies'}</Button>
                  </li>
                  <li>
                    <Button variant="ghost">{isClient ? t('markets.forex') : 'Forex'}</Button>
                  </li>
                  <li>
                    <Button variant="ghost">{isClient ? t('markets.stocks') : 'Stocks'}</Button>
                  </li>
                  <li>
                    <Button variant="ghost">{isClient ? t('nav.portfolio') : 'Portfolio'}</Button>
                  </li>
                </ul>
              </nav>
              <MarketSentimentHeader />
              <LanguageSelector />
              <ThemeToggle />
              <div className="flex items-center space-x-2">
                <Switch id="live-updates" checked={liveUpdates} onCheckedChange={setLiveUpdates} />
                <Label htmlFor="live-updates">{isClient ? t('common.liveUpdates') : 'Live Updates'}</Label>
              </div>
            </div>
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 flex-1">
          <div className="flex flex-col gap-4 mb-6">
            <div className="w-full">
              <RealTimeMarketChart />
            </div>
          </div>
          
          <MarketOverviewBanner liveUpdates={liveUpdates} />
          
          {/* Nuevos Widgets Inteligentes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
            <AIOpportunityWidget />
            <PersonalStreakWidget />
            <TradingPositionsWidget />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <AchievementsWidget />
            <HotMarketWidget />
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <SmartAlertsWidget />
            <DailyChallengeWidget />
          </div>

          <BentoGrid liveUpdates={liveUpdates} cryptoData={displayData} />
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
