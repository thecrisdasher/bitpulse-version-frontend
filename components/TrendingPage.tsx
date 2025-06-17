"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ArrowUpDown, Search, RefreshCw, Wifi, WifiOff, AlertCircle } from "lucide-react"
import { useTrendingData, type TrendingCrypto } from "@/hooks/useTrendingData"

interface TrendingPageProps {
  liveUpdates?: boolean;
}

const TrendingPage = ({ liveUpdates = true }: TrendingPageProps) => {
  const [searchTerm, setSearchTerm] = useState("")
  const [sortConfig, setSortConfig] = useState({ key: "rank", direction: "ascending" })

  // Usar el hook mejorado con fallback automático
  const { 
    data: trendingCryptos, 
    loading, 
    error, 
    lastUpdate, 
    usingFallback, 
    refresh 
  } = useTrendingData(20, liveUpdates ? 30000 : 0); // Actualizar cada 30s si liveUpdates está activo

  const handleSort = (key: string) => {
    let direction = "ascending"
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending"
    }
    setSortConfig({ key, direction })
  }

  // Ordenar y filtrar datos
  const processedCryptos = (() => {
    let filtered = trendingCryptos.filter(
      (crypto) =>
        crypto.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        crypto.symbol.toLowerCase().includes(searchTerm.toLowerCase()),
    );

    // Aplicar ordenamiento
    if (sortConfig.key) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortConfig.key as keyof TrendingCrypto];
        const bVal = b[sortConfig.key as keyof TrendingCrypto];
        
        if (aVal < bVal) return sortConfig.direction === "ascending" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "ascending" ? 1 : -1;
        return 0;
      });
    }

    return filtered;
  })();

  // Función auxiliar para formatear números grandes
  const formatLargeNumber = (num: number): string => {
    if (num >= 1e12) return `$${(num / 1e12).toFixed(2)}T`;
    if (num >= 1e9) return `$${(num / 1e9).toFixed(2)}B`;
    if (num >= 1e6) return `$${(num / 1e6).toFixed(2)}M`;
    if (num >= 1e3) return `$${(num / 1e3).toFixed(2)}K`;
    return `$${num.toLocaleString()}`;
  };

  // Componente de loading skeleton
  const LoadingSkeleton = () => (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[50px]">Rank</TableHead>
          <TableHead>Name</TableHead>
          <TableHead>Price</TableHead>
          <TableHead>24h Change</TableHead>
          <TableHead>Market Cap</TableHead>
          <TableHead>Volume (24h)</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 10 }, (_, i) => (
          <TableRow key={i}>
            <TableCell><Skeleton className="h-4 w-8" /></TableCell>
            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Trending Cryptocurrencies
              {usingFallback ? (
                <Badge variant="outline" className="text-orange-600 border-orange-600">
                  <WifiOff className="w-3 h-3 mr-1" />
                  Modo Simulación
                </Badge>
              ) : (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Wifi className="w-3 h-3 mr-1" />
                  Datos en Vivo
                </Badge>
              )}
            </CardTitle>
            {lastUpdate && (
              <p className="text-sm text-muted-foreground mt-1">
                Última actualización: {lastUpdate.toLocaleTimeString('es-ES')}
              </p>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refresh}
            disabled={loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Error Alert */}
        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Controles de búsqueda y ordenamiento */}
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
              <SelectItem value="marketCap">Market Cap</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tabla de datos */}
        {loading ? (
          <LoadingSkeleton />
        ) : (
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
              {processedCryptos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? 'No se encontraron resultados para tu búsqueda' : 'No hay datos disponibles'}
                  </TableCell>
                </TableRow>
              ) : (
                processedCryptos.map((crypto, index) => (
                  <TableRow key={crypto.id} className="hover:bg-muted/50">
                    <TableCell className="font-medium">{crypto.rank}</TableCell>
                    <TableCell className="font-medium">
                      <div className="flex flex-col">
                        <span className="font-semibold">{crypto.name}</span>
                        <span className="text-sm text-muted-foreground">{crypto.symbol}</span>
                      </div>
                    </TableCell>
                    <TableCell className="font-mono">
                      ${crypto.price.toLocaleString(undefined, { 
                        minimumFractionDigits: 2, 
                        maximumFractionDigits: crypto.price < 1 ? 8 : 2 
                      })}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={crypto.change24h >= 0 ? "default" : "destructive"}
                        className={crypto.change24h >= 0 ? "bg-green-100 text-green-800 border-green-200" : ""}
                      >
                        {crypto.change24h > 0 ? "+" : ""}
                        {crypto.change24h.toFixed(2)}%
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatLargeNumber(crypto.marketCap)}
                    </TableCell>
                    <TableCell className="font-mono">
                      {formatLargeNumber(crypto.volume24h)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}

        {/* Información de estado */}
        {!loading && !error && (
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Mostrando {processedCryptos.length} de {trendingCryptos.length} criptomonedas
            </span>
            <div className="flex items-center gap-4">
              {usingFallback && (
                <span className="text-orange-600">
                  ⚠️ Usando datos simulados - API externa no disponible
                </span>
              )}
              {liveUpdates && (
                <span>
                  🔄 Actualización automática cada 30s
                </span>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TrendingPage
