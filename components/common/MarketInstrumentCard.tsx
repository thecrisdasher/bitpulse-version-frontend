import React from 'react';
import { MarketData } from '@/lib/api/marketDataService';
import InstrumentIcon from './InstrumentIcon';
import { ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/solid';
import { formatCurrency } from '@/lib/utils/formatters';

interface MarketInstrumentCardProps {
  data: MarketData;
  category: string;
  onClick?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

const MarketInstrumentCard: React.FC<MarketInstrumentCardProps> = ({
  data,
  category,
  onClick,
  className = '',
  size = 'md',
  showDetails = true
}) => {
  if (!data) return null;
  
  const isPositive = data.changePercent24h >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const bgChangeColor = isPositive ? 'bg-green-100' : 'bg-red-100';
  
  // Determine sizes based on the size prop
  const cardSize = {
    sm: 'p-2 rounded-lg',
    md: 'p-3 rounded-lg',
    lg: 'p-4 rounded-xl'
  }[size];
  
  const iconSize = {
    sm: 16,
    md: 24,
    lg: 32
  }[size];
  
  const nameSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  const priceSize = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl font-semibold'
  }[size];
  
  const changeSize = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  }[size];
  
  return (
    <div 
      className={`bg-white border border-gray-200 shadow-sm hover:shadow-md transition-all 
        ${cardSize} ${className} cursor-pointer relative overflow-hidden`}
      onClick={onClick}
    >
      {/* Real-time indicator */}
      {data.isRealTime && (
        <div className="absolute top-2 right-2">
          <span className="flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
          </span>
        </div>
      )}
      
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-2">
          <InstrumentIcon 
            symbol={data.symbol} 
            category={category as any}
            size={iconSize}
            showBackground={true}
            animated={true}
          />
          <div>
            <h3 className={`font-medium ${nameSize}`}>{data.name}</h3>
            <p className="text-xs text-gray-500">{data.symbol}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className={`${priceSize}`}>
            {formatCurrency(data.currentPrice, 'COP')}
          </div>
          <div className={`flex items-center justify-end ${changeSize} ${changeColor}`}>
            {isPositive ? (
              <ArrowUpIcon className="h-3 w-3 mr-1" />
            ) : (
              <ArrowDownIcon className="h-3 w-3 mr-1" />
            )}
            <span className="font-medium">{data.changePercent24h.toFixed(2)}%</span>
          </div>
        </div>
      </div>
      
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-100">
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <p className="text-gray-500">Alto 24h</p>
              <p className="font-medium">{data.high24h ? formatCurrency(data.high24h, 'COP') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Bajo 24h</p>
              <p className="font-medium">{data.low24h ? formatCurrency(data.low24h, 'COP') : 'N/A'}</p>
            </div>
            <div>
              <p className="text-gray-500">Cambio 24h</p>
              <p className={`font-medium ${changeColor}`}>
                {formatCurrency(data.change24h, 'COP')}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Última actualización</p>
              <p className="font-medium">
                {new Date(data.lastUpdated).toLocaleTimeString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketInstrumentCard; 