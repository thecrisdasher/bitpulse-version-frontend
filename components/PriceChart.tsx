import type React from "react"
import { Line } from "react-chartjs-2"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js"

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend)

interface PriceChartProps {
  priceHistory: number[]
}

const PriceChart: React.FC<PriceChartProps> = ({ priceHistory }) => {
  const data = {
    labels: ["6d ago", "5d ago", "4d ago", "3d ago", "2d ago", "Yesterday", "Today"],
    datasets: [
      {
        label: "Price",
        data: priceHistory,
        fill: false,
        borderColor: "hsl(var(--primary))",
        tension: 0.1,
      },
    ],
  }

  const options = {
    responsive: true,
    plugins: {
      legend: {
        display: false,
      },
      title: {
        display: true,
        text: "7 Day Price History",
        color: "hsl(var(--foreground))",
      },
    },
    scales: {
      x: {
        grid: {
          color: "hsl(var(--border))",
        },
        ticks: {
          color: "hsl(var(--foreground))",
        },
      },
      y: {
        grid: {
          color: "hsl(var(--border))",
        },
        ticks: {
          color: "hsl(var(--foreground))",
        },
      },
    },
  }

  return <Line data={data} options={options} />
}

export default PriceChart
