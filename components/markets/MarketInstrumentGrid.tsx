import React, { useState, useMemo } from 'react';
import { MarketData } from '@/lib/api/marketDataService';
import MarketInstrumentCard from '../common/MarketInstrumentCard';
import { ArrowUpIcon, ArrowDownIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/solid';

interface MarketInstrumentGridProps {
  instruments: MarketData[];
  category: string;
  onSelectInstrument?: (instrument: MarketData) => void;
  className?: string;
  cardSize?: 'sm' | 'md' | 'lg';
  enableFiltering?: boolean;
  loading?: boolean;
}

// Sort options
type SortOption = 'name' | 'price' | 'change' | 'default';
type SortDirection = 'asc' | 'desc';

const MarketInstrumentGrid: React.FC<MarketInstrumentGridProps> = ({
  instruments,
  category,
  onSelectInstrument,
  className = '',
  cardSize = 'md',
  enableFiltering = true,
  loading = false
}) => {
  // State for search filter
  const [searchTerm, setSearchTerm] = useState('');
  
  // State for sorting
  const [sortOption, setSortOption] = useState<SortOption>('default');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Toggle sort direction
  const toggleSort = (option: SortOption) => {
    if (sortOption === option) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortOption(option);
      setSortDirection('desc'); // Default to descending for new sort options
    }
  };
  
  // Filter and sort instruments
  const filteredAndSortedInstruments = useMemo(() => {
    // First filter by search term
    let filtered = instruments;
    
    if (searchTerm) {
      const lowercaseSearch = searchTerm.toLowerCase();
      filtered = instruments.filter(
        instrument => 
          instrument.name.toLowerCase().includes(lowercaseSearch) || 
          instrument.symbol.toLowerCase().includes(lowercaseSearch)
      );
    }
    
    // Then sort
    return [...filtered].sort((a, b) => {
      let comparison = 0;
      
      switch (sortOption) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'price':
          comparison = a.currentPrice - b.currentPrice;
          break;
        case 'change':
          comparison = a.changePercent24h - b.changePercent24h;
          break;
        default:
          return 0; // No sorting
      }
      
      // Apply sort direction
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [instruments, searchTerm, sortOption, sortDirection]);
  
  // Generate sort button with appropriate arrow direction
  const renderSortButton = (label: string, option: SortOption) => {
    const isActive = sortOption === option;
    const Icon = sortDirection === 'asc' ? ArrowUpIcon : ArrowDownIcon;
    
    return (
      <button 
        className={`px-3 py-1 rounded text-sm font-medium flex items-center
          ${isActive ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
        onClick={() => toggleSort(option)}
      >
        {label}
        {isActive && <Icon className="ml-1 h-3 w-3" />}
      </button>
    );
  };
  
  // Render loading skeleton
  const renderSkeleton = () => {
    return Array(8).fill(0).map((_, index) => (
      <div key={`skeleton-${index}`} className="animate-pulse">
        <div className={`bg-gray-200 rounded-lg ${cardSize === 'sm' ? 'h-20' : cardSize === 'md' ? 'h-28' : 'h-36'}`}></div>
      </div>
    ));
  };
  
  return (
    <div className={className}>
      {enableFiltering && (
        <div className="mb-4 flex flex-col sm:flex-row justify-between space-y-2 sm:space-y-0 sm:space-x-2">
          {/* Search field */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-4 w-4 text-gray-400" />
            </div>
            <input
              type="text"
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm"
              placeholder="Buscar instrumento..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          
          {/* Sort buttons */}
          <div className="flex space-x-2 items-center">
            <FunnelIcon className="h-4 w-4 text-gray-500" />
            <div className="text-sm text-gray-500">Ordenar por:</div>
            <div className="flex space-x-1">
              {renderSortButton('Nombre', 'name')}
              {renderSortButton('Precio', 'price')}
              {renderSortButton('Cambio', 'change')}
            </div>
          </div>
        </div>
      )}
      
      {/* Grid layout */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {loading 
          ? renderSkeleton()
          : filteredAndSortedInstruments.map(instrument => (
            <MarketInstrumentCard 
              key={instrument.symbol}
              data={instrument}
              category={category}
              size={cardSize}
              onClick={() => onSelectInstrument?.(instrument)}
            />
          ))
        }
        
        {/* No results message */}
        {!loading && filteredAndSortedInstruments.length === 0 && (
          <div className="col-span-full p-8 text-center bg-gray-50 rounded-lg">
            <p className="text-gray-500">No se encontraron instrumentos que coincidan con su búsqueda.</p>
          </div>
        )}
      </div>
      
      {/* Results count */}
      {!loading && instruments.length > 0 && (
        <div className="mt-4 text-sm text-gray-500">
          Mostrando {filteredAndSortedInstruments.length} de {instruments.length} instrumentos
        </div>
      )}
    </div>
  );
};

export default MarketInstrumentGrid; 