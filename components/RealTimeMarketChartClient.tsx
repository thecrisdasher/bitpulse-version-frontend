"use client";

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { createChart, ColorType, AreaSeries, Time } from 'lightweight-charts';

// Define types for props
interface ChartProps {
  data?: {
    time: Time;
    value: number;
  }[];
  colors?: {
    backgroundColor?: string;
    lineColor?: string;
    textColor?: string;
    areaTopColor?: string;
    areaBottomColor?: string;
  };
  width?: number;
  height?: number;
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

// Chart Component
const RealTimeMarketChartClient: React.FC<ChartProps> = ({
  data = [],
  colors = {
    backgroundColor: 'transparent',
    lineColor: '#2962FF',
    textColor: 'rgba(255, 255, 255, 0.6)',
    areaTopColor: 'rgba(41, 98, 255, 0.3)',
    areaBottomColor: 'rgba(41, 98, 255, 0.0)',
  },
  width = 500,
  height = 300,
}) => {
  // Refs for elements and chart instance
  const chartContainerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<any>(null);
  const seriesRef = useRef<any>(null);
  const resizeObserverRef = useRef<ResizeObserver | null>(null);
  const initializedRef = useRef<boolean>(false);
  
  // State for dimensions
  const [dimensions, setDimensions] = useState({
    width: width || 500,
    height: height || 300
  });

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
        },
        rightPriceScale: {
          borderColor: 'rgba(197, 203, 206, 0.4)',
        },
        crosshair: {
          mode: 0, // 0 for normal crosshair
        },
      });
      
      // Create series
      const series = chart.addSeries(AreaSeries, {
        lineColor: colors.lineColor,
        topColor: colors.areaTopColor,
        bottomColor: colors.areaBottomColor,
        lineWidth: 2,
      });
      
      // Store references
      chartRef.current = chart;
      seriesRef.current = series;
      initializedRef.current = true;
      
      // Set initial data if available
      if (data && data.length > 0) {
        series.setData(data);
      }
      
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
  }, [colors, dimensions.width, dimensions.height, data]);

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

  // Update data when it changes
  useEffect(() => {
    if (!seriesRef.current || !data || data.length === 0) return;
    
    try {
      // Check if chart is still valid before updating
      if (chartRef.current) {
        try {
          // Only update if we can access chart options (chart is not disposed)
          const options = chartRef.current.options();
          if (options) {
            seriesRef.current.setData(data);
            chartRef.current.timeScale().fitContent();
          }
        } catch (err) {
          // Chart is disposed, reinitialize if needed
          console.log("Chart disposed, skipping data update");
          initializedRef.current = false;
        }
      }
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
    
    // Update series colors
    seriesRef.current.applyOptions({
      lineColor: colors.lineColor,
      topColor: colors.areaTopColor,
      bottomColor: colors.areaBottomColor,
    });
  }, [colors]);

  return (
    <div 
      ref={chartContainerRef} 
      style={{ 
        width: '100%', 
        height: '100%',
        minHeight: '300px'
      }}
    />
  );
};

export default RealTimeMarketChartClient; 