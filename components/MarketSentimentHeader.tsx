import { marketSentiment } from "@/lib/mockData"
import { Gauge } from "lucide-react"

const MarketSentimentHeader = () => {
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
    <div className="flex items-center space-x-2">
      <Gauge className="h-4 w-4 text-muted-foreground" />
      <div className="text-sm font-medium">
        <span className={getColor()}>{value}</span>
        <span className="mx-1">-</span>
        <span className={getColor()}>{getDescription()}</span>
      </div>
      <div className={`text-xs ${change >= 0 ? "text-green-500" : "text-red-500"}`}>
        {change > 0 ? "+" : ""}
        {change}
      </div>
    </div>
  )
}

export default MarketSentimentHeader
