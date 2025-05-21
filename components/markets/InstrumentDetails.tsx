import React from 'react';
import { 
  ClockIcon, TagIcon, ScaleIcon, 
  CurrencyDollarIcon, ChartBarIcon, InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { InstrumentDetails } from '@/hooks/useInstrumentDetails';
import InstrumentIcon from '../common/InstrumentIcon';
import { formatCurrency, formatPercent } from '@/lib/utils/formatters';

interface InstrumentDetailsViewProps {
  details: InstrumentDetails;
  className?: string;
}

const RiskIndicator: React.FC<{ level: string }> = ({ level }) => {
  const riskLevels = [
    { key: 'low', color: 'bg-green-500', label: 'Bajo' },
    { key: 'medium', color: 'bg-yellow-500', label: 'Medio' },
    { key: 'high', color: 'bg-orange-500', label: 'Alto' },
    { key: 'very-high', color: 'bg-red-500', label: 'Muy Alto' },
  ];

  const currentIndex = riskLevels.findIndex(risk => risk.key === level) || 0;
  
  return (
    <div className="flex flex-col space-y-1">
      <div className="flex items-center space-x-2">
        <span className="text-sm font-medium">{riskLevels[currentIndex]?.label || 'Medio'}</span>
      </div>
      <div className="flex h-2 w-full rounded-full bg-gray-200">
        {riskLevels.map((risk, index) => (
          <div 
            key={risk.key}
            className={`h-full rounded-full ${risk.color} ${index <= currentIndex ? 'opacity-100' : 'opacity-30'}`}
            style={{ width: `${100 / riskLevels.length}%` }}
          />
        ))}
      </div>
    </div>
  );
};

const InstrumentDetailsView: React.FC<InstrumentDetailsViewProps> = ({ 
  details,
  className = ''
}) => {
  const { marketData, metadata, loading, error } = details;
  
  if (loading) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 animate-pulse ${className}`}>
        <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-2/3 mb-6"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-40 bg-gray-200 rounded"></div>
          <div className="h-40 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <InformationCircleIcon className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <h3 className="text-lg font-medium text-gray-900">Error al cargar datos</h3>
            <p className="mt-1 text-sm text-gray-500">{error}</p>
          </div>
        </div>
      </div>
    );
  }
  
  if (!marketData || !metadata) return null;
  
  const isPositive = marketData.changePercent24h >= 0;
  const changeColor = isPositive ? 'text-green-600' : 'text-red-600';
  const category = metadata.tags?.[0] || 'general';
  
  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      {/* Header section */}
      <div className="flex items-center space-x-3 mb-4">
        <InstrumentIcon 
          symbol={marketData.symbol} 
          category={category as any} 
          size={40}
          showBackground={true}
        />
        <div>
          <h2 className="text-2xl font-bold">{metadata.fullName || marketData.name}</h2>
          <p className="text-sm text-gray-500">{marketData.symbol}</p>
        </div>
        
        {marketData.isRealTime && (
          <span className="ml-auto inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            <span className="flex h-2 w-2 mr-1">
              <span className="animate-ping absolute inline-flex h-2 w-2 rounded-full bg-green-500 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600"></span>
            </span>
            Tiempo real
          </span>
        )}
      </div>
      
      {/* Description */}
      {metadata.description && (
        <p className="text-gray-600 mb-6">
          {metadata.description}
        </p>
      )}
      
      {/* Price and data grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Price section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-500 mb-1">Precio actual</h3>
            <div className="flex items-baseline">
              <span className="text-3xl font-bold">{formatCurrency(marketData.currentPrice, 'COP')}</span>
              <span className={`ml-2 ${changeColor} text-sm font-medium`}>
                {formatPercent(marketData.changePercent24h)}
              </span>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <h4 className="text-gray-500 mb-1">Cambio 24h</h4>
              <p className={`font-medium ${changeColor}`}>{formatCurrency(marketData.change24h, 'COP')}</p>
            </div>
            <div>
              <h4 className="text-gray-500 mb-1">Última actualización</h4>
              <p className="font-medium">{new Date(marketData.lastUpdated).toLocaleTimeString()}</p>
            </div>
            <div>
              <h4 className="text-gray-500 mb-1">Alto 24h</h4>
              <p className="font-medium">{marketData.high24h ? formatCurrency(marketData.high24h, 'COP') : 'N/A'}</p>
            </div>
            <div>
              <h4 className="text-gray-500 mb-1">Bajo 24h</h4>
              <p className="font-medium">{marketData.low24h ? formatCurrency(marketData.low24h, 'COP') : 'N/A'}</p>
            </div>
          </div>
        </div>
        
        {/* Metadata section */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-4">Información del instrumento</h3>
          
          <div className="space-y-4">
            {/* Trading hours */}
            <div className="flex items-start">
              <ClockIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Horario de trading</h4>
                <p className="text-sm text-gray-600">{metadata.tradingHours || 'No disponible'}</p>
              </div>
            </div>
            
            {/* Minimum trade */}
            <div className="flex items-start">
              <CurrencyDollarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div>
                <h4 className="text-sm font-medium">Operación mínima</h4>
                <p className="text-sm text-gray-600">
                  {metadata.minimumTrade ? formatCurrency(metadata.minimumTrade, 'COP') : 'No disponible'}
                </p>
              </div>
            </div>
            
            {/* Risk level */}
            <div className="flex items-start">
              <ScaleIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium">Nivel de riesgo</h4>
                <RiskIndicator level={metadata.riskLevel || 'medium'} />
              </div>
            </div>
            
            {/* Tags */}
            {metadata.tags && metadata.tags.length > 0 && (
              <div className="flex items-start">
                <TagIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div>
                  <h4 className="text-sm font-medium">Etiquetas</h4>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {metadata.tags.map(tag => (
                      <span key={tag} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Popularity */}
            {metadata.popularity !== undefined && (
              <div className="flex items-start">
                <ChartBarIcon className="h-5 w-5 text-gray-400 mr-2 mt-0.5" />
                <div className="flex-1">
                  <h4 className="text-sm font-medium">Popularidad</h4>
                  <div className="mt-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-500 rounded-full" 
                        style={{ width: `${metadata.popularity}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Market data last updated disclaimer */}
      <div className="text-xs text-gray-500 text-right">
        Datos actualizados: {new Date(marketData.lastUpdated).toLocaleString()}
      </div>
    </div>
  );
};

export default InstrumentDetailsView; 