import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { marketSentiment } from "@/lib/mockData"
import { Gauge } from "lucide-react"

const MarketSentiment = () => {
  const { value, change, label } = marketSentiment

  const getColor = () => {
    if (value < 25) return "text-red-500"
    if (value < 50) return "text-yellow-500"
    if (value < 75) return "text-green-500"
    return "text-blue-500"
  }

  const getDescription = () => {
    if (value < 25) return "Extreme Fear"
    if (value < 50) return "Fear"
    if (value < 75) return "Greed"
    return "Extreme Greed"
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Market Sentiment</CardTitle>
        <Gauge className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center">
          <div className={`text-4xl font-bold ${getColor()}`}>{value}</div>
          <div className={`text-lg font-semibold ${getColor()}`}>{label}</div>
          <div className="text-sm text-muted-foreground">{getDescription()}</div>
          <div className={change >= 0 ? "text-green-500" : "text-red-500"}>
            {change > 0 ? "+" : ""}
            {change} points
          </div>
        </div>
        <div className="mt-4 h-2 w-full bg-secondary rounded-full overflow-hidden">
          <div className={`h-full ${getColor()}`} style={{ width: `${value}%` }}></div>
        </div>
      </CardContent>
    </Card>
  )
}

export default MarketSentiment
