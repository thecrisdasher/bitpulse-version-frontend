import React from 'react';
import { 
  CurrencyDollarIcon, CurrencyEuroIcon, CurrencyPoundIcon, CurrencyYenIcon,
  ChartBarIcon, ArrowTrendingUpIcon, CubeIcon, CircleStackIcon,
  BoltIcon, FireIcon, BeakerIcon
} from '@heroicons/react/24/solid';
import { 
  FaBitcoin, FaEthereum, FaDollarSign, FaEuroSign, 
  FaYenSign, FaPoundSign, FaGem, FaWater, FaOilCan, 
  FaChartLine, FaCube, FaRandom, FaRegGem
} from 'react-icons/fa';
import { 
  SiBinance, SiDogecoin, SiCardano, SiLitecoin,
  SiRipple, SiTether, SiPolkadot, SiSolana,
  SiChainlink
} from 'react-icons/si';
import { 
  GiGoldBar, GiOilDrum, GiWheat, 
  GiCoffeeBeans, GiCottonFlower, GiGrain,
  GiCorn, GiWoodPile
} from 'react-icons/gi';
import { HiOutlineCurrencyDollar } from 'react-icons/hi';
import { MdShowChart, MdLoop } from 'react-icons/md';
import { BsGraphUp, BsGraphDown, BsArrowRepeat, BsCurrencyBitcoin } from 'react-icons/bs';

export type InstrumentCategory = 
  'criptomonedas' | 
  'forex' | 
  'indices' | 
  'materias-primas' | 
  'acciones';

interface InstrumentIconProps {
  symbol: string;
  category: InstrumentCategory;
  size?: number;
  className?: string;
  showBackground?: boolean;
  animated?: boolean;
}

const InstrumentIcon: React.FC<InstrumentIconProps> = ({ 
  symbol, 
  category, 
  size = 20,
  className = '',
  showBackground = false,
  animated = false
}) => {
  // Normalize symbol for comparison
  const normalizedSymbol = symbol.toUpperCase().replace('/', '');
  
  // Default color scheme based on category
  let colorClass = '';
  let bgColorClass = '';
  
  switch (category) {
    case 'criptomonedas':
      colorClass = 'text-orange-500';
      bgColorClass = 'bg-orange-100';
      break;
    case 'forex':
      colorClass = 'text-green-600';
      bgColorClass = 'bg-green-100';
      break;
    case 'indices':
      colorClass = 'text-blue-600';
      bgColorClass = 'bg-blue-100';
      break;
    case 'materias-primas':
      colorClass = 'text-yellow-600';
      bgColorClass = 'bg-yellow-100';
      break;


    case 'acciones':
      colorClass = 'text-teal-600';
      bgColorClass = 'bg-teal-100';
      break;
    default:
      colorClass = 'text-gray-600';
      bgColorClass = 'bg-gray-100';
  }
  
  // Animation class if enabled
  const animationClass = animated ? 'transition-transform hover:scale-110' : '';
  
  // Apply specific icons based on symbol and category
  const renderIcon = () => {
    // Cryptocurrencies
    if (category === 'criptomonedas') {
      if (normalizedSymbol.includes('BTC')) return <FaBitcoin size={size} />;
      if (normalizedSymbol.includes('ETH')) return <FaEthereum size={size} />;
      if (normalizedSymbol.includes('BNB')) return <SiBinance size={size} />;
      if (normalizedSymbol.includes('DOGE')) return <SiDogecoin size={size} />;
      if (normalizedSymbol.includes('ADA')) return <SiCardano size={size} />;
      if (normalizedSymbol.includes('XRP')) return <SiRipple size={size} />;
      if (normalizedSymbol.includes('LTC')) return <SiLitecoin size={size} />;
      if (normalizedSymbol.includes('USDT')) return <SiTether size={size} />;
      if (normalizedSymbol.includes('DOT')) return <SiPolkadot size={size} />;
      if (normalizedSymbol.includes('SOL')) return <SiSolana size={size} />;
      if (normalizedSymbol.includes('LINK')) return <SiChainlink size={size} />;
      return <BsCurrencyBitcoin size={size} />; // Default crypto icon
    }
    
    // Forex
    if (category === 'forex') {
      if (normalizedSymbol.includes('USD')) return <CurrencyDollarIcon width={size} height={size} />;
      if (normalizedSymbol.includes('EUR')) return <CurrencyEuroIcon width={size} height={size} />;
      if (normalizedSymbol.includes('JPY')) return <CurrencyYenIcon width={size} height={size} />;
      if (normalizedSymbol.includes('GBP')) return <CurrencyPoundIcon width={size} height={size} />;
      return <HiOutlineCurrencyDollar size={size} />; // Default forex icon
    }
    
    // Indices
    if (category === 'indices') {
      if (normalizedSymbol.includes('SPX') || normalizedSymbol.includes('SPY'))
        return <ChartBarIcon width={size} height={size} />;
      if (normalizedSymbol.includes('DOW') || normalizedSymbol.includes('DJI'))
        return <ArrowTrendingUpIcon width={size} height={size} />;
      return <BsGraphUp size={size} />;
    }
    
    // Commodities
    if (category === 'materias-primas') {
      if (normalizedSymbol.includes('XAU') || normalizedSymbol.includes('GOLD')) 
        return <GiGoldBar size={size} />;
      if (normalizedSymbol.includes('XAG') || normalizedSymbol.includes('SILVER')) 
        return <FaRegGem size={size} />;
      if (normalizedSymbol.includes('OIL')) return <GiOilDrum size={size} />;
      if (normalizedSymbol.includes('WHEAT')) return <GiWheat size={size} />;
      if (normalizedSymbol.includes('CORN')) return <GiCorn size={size} />;
      if (normalizedSymbol.includes('COFFEE')) return <GiCoffeeBeans size={size} />;
      if (normalizedSymbol.includes('COTTON')) return <GiCottonFlower size={size} />;
      if (normalizedSymbol.includes('GAS') || normalizedSymbol.includes('NGAS')) 
        return <FaWater size={size} />;
      if (normalizedSymbol.includes('LUMBER')) return <GiWoodPile size={size} />;
      return <GiGrain size={size} />; // Default commodity icon
    }
    

    

    
    // Stocks
    if (category === 'acciones') {
      return <FaChartLine size={size} />;
    }
    
    // Default icon
    return <BeakerIcon width={size} height={size} />;
  };
  
  return (
    <div className={`inline-flex items-center justify-center ${animationClass} ${className}
      ${showBackground ? `p-2 rounded-full ${bgColorClass}` : ''} ${colorClass}`}>
      {renderIcon()}
    </div>
  );
};

export default InstrumentIcon; 