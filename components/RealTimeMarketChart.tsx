import { useState, useEffect, useRef } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartData,
  ChartOptions,
  TooltipItem,
} from "chart.js";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// Register the Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Define market type
type Market = "volatility" | "bitcoin" | "ethereum" | "gold" | "silver";
type ChartRef = ChartJS<"line", string[], string>;

// Mock data fetching function
const fetchMarketData = async (market: Market): Promise<{ data: string[], labels: string[] }> => {
  // This is a simulation function that generates data based on selected market
  // In a real implementation, this would be an API call
  const baseValue = market === "volatility" ? 623 : 
                   market === "bitcoin" ? 29000 : 
                   market === "ethereum" ? 1800 : 
                   market === "gold" ? 2400 : 
                   market === "silver" ? 30 : 500;
  
  const now = new Date();
  const data: string[] = [];
  const labels: string[] = [];
  
  // Generate data for the last 30 minutes
  for (let i = 30; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    labels.push(time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    
    // Add some randomness to simulate real market data
    const value = baseValue + (Math.random() * baseValue * 0.05) - (baseValue * 0.025);
    data.push(value.toFixed(2));
  }
  
  return { data, labels };
};

// Market data
const markets = [
  { id: "volatility" as Market, name: "Volatility 100", color: "hsl(338, 90%, 56%)" },
  { id: "bitcoin" as Market, name: "Bitcoin (BTC)", color: "hsl(41, 98%, 49%)" },
  { id: "ethereum" as Market, name: "Ethereum (ETH)", color: "hsl(207, 90%, 61%)" },
  { id: "gold" as Market, name: "Gold", color: "hsl(43, 95%, 47%)" },
  { id: "silver" as Market, name: "Silver", color: "hsl(210, 20%, 80%)" },
];

// Growth rate options
const growthRates = [
  { id: "1", label: "1%", value: 1 },
  { id: "2", label: "2%", value: 2 },
  { id: "3", label: "3%", value: 3 },
  { id: "4", label: "4%", value: 4 },
  { id: "5", label: "5%", value: 5 },
];

const RealTimeMarketChart = () => {
  const [selectedMarket, setSelectedMarket] = useState<Market>("volatility");
  const [chartData, setChartData] = useState<ChartData<"line", string[], string>>({
    labels: [],
    datasets: [],
  });
  const [selectedGrowthRate, setSelectedGrowthRate] = useState("3");
  const chartRef = useRef<ChartRef | null>(null);
  
  // Generate initial chart data on component mount and when market changes
  useEffect(() => {
    const initializeChart = async () => {
      const { data, labels } = await fetchMarketData(selectedMarket);
      const marketInfo = markets.find(m => m.id === selectedMarket);
      const color = marketInfo?.color || "hsl(var(--primary))";

      setChartData({
        labels,
        datasets: [
          {
            label: marketInfo?.name || "",
            data,
            borderColor: color,
            backgroundColor: `${color}33`, // Add transparency
            borderWidth: 3,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 8,
            pointBackgroundColor: color,
            pointHoverBackgroundColor: "#fff",
            pointBorderColor: "#fff",
            pointHoverBorderColor: color,
            pointBorderWidth: 2,
            pointHoverBorderWidth: 3,
          },
        ],
      });
    };

    initializeChart();
  }, [selectedMarket]);

  // Update chart data every second to simulate real-time updates
  useEffect(() => {
    const interval = setInterval(async () => {
      if (!chartRef.current) return;
      
      const market = markets.find(m => m.id === selectedMarket);
      if (!market) return;
      
      const chart = chartRef.current;
      
      // Ensure data and labels are arrays
      if (!chart.data.datasets[0]?.data || !chart.data.labels) return;
      
      const data = [...(chart.data.datasets[0].data as string[])];
      const labels = [...(chart.data.labels as string[])];
      
      // Add new data point
      const now = new Date();
      const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      // Get the last value and add some random movement
      const lastValue = parseFloat(data[data.length - 1]);
      const baseValue = market.id === "volatility" ? 623 : 
                       market.id === "bitcoin" ? 29000 : 
                       market.id === "ethereum" ? 1800 : 
                       market.id === "gold" ? 2400 : 
                       market.id === "silver" ? 30 : 500;
      
      // Use selected growth rate to influence the randomness
      const growthRateValue = parseInt(selectedGrowthRate) / 100;
      const randomFactor = (Math.random() * growthRateValue * 2) - growthRateValue;
      const newValue = lastValue * (1 + randomFactor);
      
      // Update chart data
      labels.push(timeString);
      data.push(newValue.toFixed(2));
      
      // Remove oldest data to keep a consistent window
      if (labels.length > 30) {
        labels.shift();
        data.shift();
      }
      
      // Update the chart data
      chart.data.labels = labels;
      chart.data.datasets[0].data = data;
      
      // Force update
      chart.update();
    }, 1000);

    return () => clearInterval(interval);
  }, [selectedMarket, selectedGrowthRate]);

  const chartOptions: ChartOptions<"line"> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        mode: 'index' as const,
        intersect: false,
        callbacks: {
          label: function(context: TooltipItem<"line">) {
            const value = parseFloat(context.raw as string).toFixed(2);
            return `${context.dataset.label}: ${value}`;
          }
        },
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#fff',
        bodyColor: '#fff',
        borderColor: 'rgba(255, 255, 255, 0.2)',
        borderWidth: 1,
        padding: 10,
        displayColors: false,
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(var(--border) / 0.2)",
          display: true,
        },
        ticks: {
          color: "hsl(var(--foreground) / 0.8)",
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 8,
          font: {
            size: 10,
          },
        },
        border: {
          display: false,
        },
      },
      y: {
        grid: {
          color: "hsl(var(--border) / 0.2)",
          display: true,
        },
        ticks: {
          color: "hsl(var(--foreground) / 0.8)",
          padding: 8,
          font: {
            size: 11,
          },
        },
        border: {
          display: false,
        },
      }
    },
    interaction: {
      mode: 'nearest' as const,
      axis: 'x' as const,
      intersect: false
    },
    elements: {
      line: {
        borderWidth: 3
      }
    },
    hover: {
      mode: 'nearest' as const,
      intersect: false,
    },
    animation: {
      duration: 400,
    },
  };

  // Function to handle market selection
  const handleMarketChange = (value: Market) => {
    setSelectedMarket(value);
  };

  // Function to handle growth rate selection
  const handleGrowthRateChange = (value: string) => {
    setSelectedGrowthRate(value);
  };

  return (
    <Card className="mb-4">
      <CardHeader className="p-4 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-medium">
          {markets.find(m => m.id === selectedMarket)?.name || "Market Chart"}
        </CardTitle>
        <div className="flex items-center space-x-2">
          <Select value={selectedMarket} onValueChange={handleMarketChange}>
            <SelectTrigger className="w-[180px] h-8">
              <SelectValue placeholder="Select Market" />
            </SelectTrigger>
            <SelectContent>
              {markets.map((market) => (
                <SelectItem key={market.id} value={market.id}>
                  <div className="flex items-center">
                    <span className="inline-block w-3 h-3 rounded-full mr-2" style={{ backgroundColor: market.color }}></span>
                    {market.name}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <div className="flex items-center space-x-1">
            <span className="text-sm">Tasa de crecimiento</span>
            <div className="flex items-center bg-secondary rounded-md">
              {growthRates.map((rate) => (
                <Button
                  key={rate.id}
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-8 px-2 rounded-md",
                    selectedGrowthRate === rate.id && "bg-muted"
                  )}
                  onClick={() => handleGrowthRateChange(rate.id)}
                >
                  {rate.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-4">
        <div className="h-[300px] w-full">
          <Line ref={chartRef} data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
};

export default RealTimeMarketChart; 