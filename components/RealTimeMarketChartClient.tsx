"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { 
  createChart, 
  ColorType, 
  Time, 
  IPriceLine,
  LineStyle,
  AreaSeries,
  LineSeries,
  CandlestickSeries,
  BarSeries
} from 'lightweight-charts';

// Define types for props
interface ChartProps {
  data?: any[];
  chartType?: 'area' | 'line' | 'candle' | 'bar';
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
    upColor?: string;
    downColor?: string;
    wickUpColor?: string;
    wickDownColor?: string;
  };
  width?: number;
  height?: number;
  isSimulatedData?: boolean;
  levels?: {
    id?: string;
    value: number;
    color: string;
    lineWidth?: number;
    lineStyle?: number;
    title?: string;
    type?: 'soporte' | 'resistencia' | 'precio' | 'custom';
  }[];
  showLevels?: boolean;
  positionMarkers?: {
    time: number;
    position: 'aboveBar' | 'belowBar';
    color: string;
    shape: 'circle' | 'square' | 'arrowUp' | 'arrowDown';
    text: string;
    size: number;
  }[];
  onReady?: (resetZoom: () => void) => void;
}

// Format date to YYYY-MM-DD format required by lightweight-charts
const formatDateForChart = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Generate mock data for chart
const generateMockData = (days = 30, baseValue = 100) => {
  const now = new Date();
  const data = [];

  for (let i = days; i >= 0; i--) {
    const date = new Date();
    date.setDate(now.getDate() - i);
    
    // Generate random price with some trend
    const value = baseValue + (baseValue * (Math.random() * 0.2 - 0.1)) + (i * 0.5);
    
    data.push({
      time: formatDateForChart(date),
      value: Math.round(value * 100) / 100
    });
  }

  return data;
};

// Helper function to validate and format chart data
const validateChartData = (data: any[]): any[] => {
  return data
    .map(item => {
      // Ensure time is a valid number
      const time = typeof item.time === 'string' ? parseInt(item.time) : item.time;
      if (isNaN(time) || time <= 0) {
        console.warn('Invalid time value in chart data:', item);
        return null;
      }

      // For area/line charts
      if ('value' in item) {
        const value = parseFloat(item.value);
        if (isNaN(value)) {
          console.warn('Invalid value in chart data:', item);
          return null;
        }
        return { time, value };
      }

      // For candlestick/bar charts
      if ('open' in item && 'high' in item && 'low' in item && 'close' in item) {
        const open = parseFloat(item.open);
        const high = parseFloat(item.high);
        const low = parseFloat(item.low);
        const close = parseFloat(item.close);
        const volume = item.volume ? parseFloat(item.volume) : undefined;

        if (isNaN(open) || isNaN(high) || isNaN(low) || isNaN(close)) {
          console.warn('Invalid OHLC values in chart data:', item);
          return null;
        }

        return { time, open, high, low, close, ...(volume !== undefined && { volume }) };
      }

      console.warn('Invalid data format:', item);
      return null;
    })
    .filter((item): item is NonNullable<typeof item> => item !== null)
    .sort((a, b) => a.time - b.time);
};

// Chart Component
const RealTimeMarketChartClient: React.FC<ChartProps> = ({
  data = [],
  chartType = 'area',
  colors = {
    backgroundColor: 'transparent',
    lineColor: '#2962FF',
    textColor: 'rgba(255, 255, 255, 0.6)',
    areaTopColor: 'rgba(41, 98, 255, 0.3)',
    areaBottomColor: 'rgba(41, 98, 255, 0.0)',
    upColor: '#26a69a',
    downColor: '#ef5350',
    wickUpColor: '#26a69a',
    wickDownColor: '#ef5350',
  },
  width = 500,
  height = 300,
  isSimulatedData = false,
  levels = [],
  showLevels = true,
  positionMarkers = [],
  onReady,
}) => {
  // Refs for elements and chart instance
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null); 
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initializedRef = useRef<boolean>(false);
  const chartTypeRef = useRef<string>(chartType);
  const priceLineRefs = useRef<IPriceLine[]>([]);
  
  // State for dimensions
  const [dimensions, setDimensions] = useState({
    width: width || 500,
    height: height || 300
  });

  // Track previous data length for incremental updates
  const prevDataLengthRef = useRef<number>(0);

  // Function to add price levels to chart
  const addPriceLevels = useCallback(() => {
    if (!seriesRef.current || !levels) return;
    
    // Remove any existing price lines
    priceLineRefs.current.forEach(priceLine => {
      try {
        if (priceLine && seriesRef.current) {
          seriesRef.current.removePriceLine(priceLine);
        }
      } catch (error) {
        console.error("Error removing price line:", error);
      }
    });
    
    priceLineRefs.current = [];
    
    // Add new price lines based on levels
    if (showLevels) {
      levels.forEach(level => {
        try {
          const lineOptions = {
            price: level.value,
            color: level.color || '#8a0303',
            lineWidth: level.lineWidth || 1,
            lineStyle: level.lineStyle || 1, // 0 = solid, 1 = dotted, 2 = dashed, 3 = large dashed
            title: level.title || `${level.type || ''} ${level.value.toFixed(2)}`,
            axisLabelVisible: true,
          };
          
          const priceLine = seriesRef.current.createPriceLine(lineOptions);
          priceLineRefs.current.push(priceLine);
        } catch (error) {
          console.error("Error adding price line:", error);
        }
      });
    }
  }, [levels, showLevels]);

  // Function to add position markers to chart
  const addPositionMarkers = useCallback(() => {
    if (!chartRef.current || !seriesRef.current || !positionMarkers || positionMarkers.length === 0) return;
    
    try {
      // Check if setMarkers method exists on the series
      if (typeof seriesRef.current.setMarkers === 'function') {
        const markers = positionMarkers.map(marker => ({
          time: marker.time as any,
          position: marker.position,
          color: marker.color,
          shape: marker.shape,
          text: marker.text,
          size: marker.size,
        }));
        
        seriesRef.current.setMarkers(markers);
      } else {
        // Alternative approach: use chart-level markers if series markers don't work
        console.log('[Chart] Series setMarkers not available, trying alternative method');
        
        // For now, we'll skip markers if the method is not available
        // This prevents the error while maintaining functionality
        console.warn('[Chart] Position markers not supported in this chart configuration');
      }
    } catch (error) {
      console.warn("Position markers not supported in this chart type:", error);
      // Don't throw error, just log and continue
    }
  }, [positionMarkers]);

  // Initialize the chart
  const initializeChart = useCallback(() => {
    // Don't initialize if the container isn't available or chart is already initialized
    if (!chartContainerRef.current || initializedRef.current || chartRef.current) return;
    
    try {
      // Get container width and height
      const containerWidth = chartContainerRef.current.clientWidth || dimensions.width;
      const containerHeight = chartContainerRef.current.clientHeight || dimensions.height;
      
      // Create chart instance
      const chart = createChart(chartContainerRef.current, {
        width: containerWidth,
        height: containerHeight,
        layout: {
          background: { type: ColorType.Solid, color: colors.backgroundColor },
          textColor: colors.textColor,
        },
        grid: {
          vertLines: { color: 'rgba(197, 203, 206, 0.1)' },
          horzLines: { color: 'rgba(197, 203, 206, 0.1)' },
        },
        timeScale: {
          borderColor: 'rgba(197, 203, 206, 0.4)',
          timeVisible: true,
          secondsVisible: true,
          tickMarkFormatter: (time: any) => {
            const date = new Date(time * 1000);
            
            const timeOptions = {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            };
            
            return date.toLocaleTimeString(navigator.language, timeOptions as Intl.DateTimeFormatOptions);
          },
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.4)',
        },
        crosshair: {
          mode: 0, // 0 for normal crosshair
        },
      });
      
      // Create series based on chart type
      let series;
      switch (chartType) {
        case 'line':
          series = chart.addSeries(LineSeries, {
            color: colors.lineColor,
            lineWidth: 2,
          });
          break;
        case 'candle':
          series = chart.addSeries(CandlestickSeries, {
            upColor: colors.upColor,
            downColor: colors.downColor,
            borderUpColor: colors.upColor,
            borderDownColor: colors.downColor,
            wickUpColor: colors.wickUpColor,
            wickDownColor: colors.wickDownColor,
          });
          break;
        case 'bar':
          series = chart.addSeries(BarSeries, {
            upColor: colors.upColor,
            downColor: colors.downColor,
          });
          break;
        case 'area':
        default:
          series = chart.addSeries(AreaSeries, {
            lineColor: colors.lineColor,
            topColor: colors.areaTopColor,
            bottomColor: colors.areaBottomColor,
            lineWidth: 2,
          });
          break;
      }
      
      // Store references
      chartRef.current = chart;
      seriesRef.current = series;
      initializedRef.current = true;
      chartTypeRef.current = chartType;
      
      // Set initial data if available
      if (data && data.length > 0) {
        const validatedData = validateChartData(data);
        if (validatedData.length > 0) {
          series.setData(validatedData);
          chart.timeScale().fitContent();
        } else {
          console.warn('No valid data points after validation');
        }
      }
      
      // Add price levels if available
      addPriceLevels();
      
      // Setup resize handler
      const resizeObserver = new ResizeObserver(entries => {
        // Skip if chart is no longer valid
        if (!chartRef.current) return;
        
        try {
          const { width: newWidth, height: newHeight } = entries[0].contentRect;
          
          if (Math.abs(newWidth - dimensions.width) > 5 || Math.abs(newHeight - dimensions.height) > 5) {
            setDimensions({ 
              width: newWidth || containerWidth, 
              height: newHeight || containerHeight 
            });
            chart.applyOptions({ width: newWidth, height: newHeight });
            chart.timeScale().fitContent();
          }
        } catch (err) {
          console.error("Error in resize observer:", err);
        }
      });
      
      // Start observing size changes if container is still available
      if (chartContainerRef.current) {
        resizeObserver.observe(chartContainerRef.current);
        resizeObserverRef.current = resizeObserver;
      }
      
      return () => {
        try {
          resizeObserver.disconnect();
          chart.remove();
        } catch (err) {
          console.error("Error cleaning up chart:", err);
        }
      };
    } catch (err) {
      console.error("Error initializing chart:", err);
      return undefined;
    }
  }, [colors, dimensions.width, dimensions.height, chartType, data, addPriceLevels]);

  // Handle chart creation and cleanup
  useEffect(() => {
    const cleanup = initializeChart();
    
    return () => {
      try {
        if (cleanup) cleanup();
        
        // Safe cleanup of chart instance
        if (chartRef.current) {
          // Check if chart is still valid
          try {
            // Only attempt to remove if it can be accessed without error
            const options = chartRef.current.options();
            if (options) {
              chartRef.current.remove();
            }
          } catch (e) {
            // Chart is already disposed, do nothing
            console.log("Chart already disposed, skipping cleanup");
          }
          chartRef.current = null;
        }
        
        // Clean up observer
        if (resizeObserverRef.current) {
          resizeObserverRef.current.disconnect();
          resizeObserverRef.current = null;
        }
        
        // Reset initialization flag
        initializedRef.current = false;
      } catch (err) {
        console.error("Error during chart cleanup:", err);
      }
    };
  }, [initializeChart]);

  // Handle chart type changes
  useEffect(() => {
    // If chart type has changed, recreate the chart
    if (chartRef.current && chartTypeRef.current !== chartType) {
      // Clean up existing chart
      try {
        chartRef.current.remove();
        chartRef.current = null;
        seriesRef.current = null;
        initializedRef.current = false;
        chartTypeRef.current = chartType;
        
        // Reinitialize chart with new type
        setTimeout(initializeChart, 0);
      } catch (err) {
        console.error("Error switching chart type:", err);
      }
    }
  }, [chartType, initializeChart]);

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;
    try {
      const chart = chartRef.current;
      if (!chart) return;
      // Validate and sort incoming data
      const validated = validateChartData(data);
      if (validated.length === 0) {
              console.warn('No valid data points after validation');
        return;
      }
      // If first load or prev length is different (e.g. user switched timeframe), do full setData
      if (prevDataLengthRef.current === 0 || validated.length !== prevDataLengthRef.current) {
        seriesRef.current.setData(validated);
        chart.timeScale().fitContent();
      } else {
        // Incremental update: add only the newest point
        const lastPoint = validated[validated.length - 1];
        seriesRef.current.update(lastPoint as any);
        // Smooth real-time scroll to latest
        chart.timeScale().scrollToRealTime();
      }
      prevDataLengthRef.current = validated.length;
    } catch (err) {
      console.error('Error updating chart data:', err);
    }
  }, [data]);

  // Update dimensions when size changes
  useEffect(() => {
    if (!chartRef.current) return;
    
    chartRef.current.applyOptions({ 
      width: dimensions.width,
      height: dimensions.height 
    });
    chartRef.current.timeScale().fitContent();
  }, [dimensions]);

  // Update chart options when colors change
  useEffect(() => {
    if (!chartRef.current || !seriesRef.current) return;
    
    // Update chart colors
    chartRef.current.applyOptions({
      layout: {
        background: { type: ColorType.Solid, color: colors.backgroundColor },
        textColor: colors.textColor,
      },
    });
    
    // Update series colors based on chart type
    try {
      switch (chartType) {
        case 'line':
          seriesRef.current.applyOptions({
            color: colors.lineColor,
          });
          break;
        
        case 'candle':
          seriesRef.current.applyOptions({
            upColor: colors.upColor,
            downColor: colors.downColor,
            wickUpColor: colors.wickUpColor,
            wickDownColor: colors.wickDownColor,
          });
          break;
          
        case 'bar':
          seriesRef.current.applyOptions({
            upColor: colors.upColor,
            downColor: colors.downColor,
          });
          break;
          
        case 'area':
        default:
          seriesRef.current.applyOptions({
            lineColor: colors.lineColor,
            topColor: colors.areaTopColor,
            bottomColor: colors.areaBottomColor,
          });
          break;
      }
    } catch (err) {
      console.error('Error updating chart colors:', err);
    }
  }, [colors, chartType]);

  // Update price levels when they change
  useEffect(() => {
    if (seriesRef.current) {
      addPriceLevels();
    }
  }, [levels, showLevels, addPriceLevels]);

  // Update position markers when they change
  useEffect(() => {
    if (seriesRef.current && positionMarkers && positionMarkers.length > 0) {
      addPositionMarkers();
    }
  }, [positionMarkers, addPositionMarkers]);

  // Expose a function to reset the zoom
  const resetZoom = useCallback(() => {
    if (chartRef.current) {
      try {
        chartRef.current.timeScale().fitContent();
      } catch (error) {
        console.error("Error resetting zoom:", error);
      }
    }
  }, []);

  // Notify parent when chart is ready
  useEffect(() => {
    if (chartRef.current && onReady && typeof onReady === 'function') {
      onReady(resetZoom);
    }
  }, [chartRef.current, onReady, resetZoom]);

  // Make resetZoom available through window for external calls
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).resetChartZoom = resetZoom;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).resetChartZoom;
      }
    };
  }, [resetZoom]);

  return (
      <div 
        ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '300px',
        position: 'relative' 
      }}
    >
    </div>
  );
};

export default RealTimeMarketChartClient;